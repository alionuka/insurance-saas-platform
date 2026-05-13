import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuthUser } from '../auth/types/auth-user';
import { PolicyStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: any = null; // Using any to avoid version-mismatch type errors with old stripe library

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (apiKey) {
      // @ts-ignore - Stripe version in package.json is very old, avoiding type conflicts
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2022-11-15' as any, // Standard older version compatible with stripe 11+
      });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set; payment endpoints will return 503');
    }
  }

  async createCheckoutSession(policyId: string, user: AuthUser) {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Payments not configured');
    }

    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { product: true },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    if (policy.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to pay for this policy');
    }

    if (policy.status !== PolicyStatus.PENDING_PAYMENT) {
      throw new BadRequestException(`Policy is not in PENDING_PAYMENT status. Current status: ${policy.status}`);
    }

    const amountCents = Math.round(policy.premiumAmount * 100);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${policy.product.name} - Annual Premium`,
              description: `Policy ${policy.policyNumber}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard/client?payment=success&policy=${policyId}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/client?payment=cancelled&policy=${policyId}`,
      metadata: {
        policyId: policy.id,
        userId: user.id,
      },
    });

    // Create a pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        policyId: policy.id,
        userId: user.id,
        amount: policy.premiumAmount,
        stripeSessionId: session.id,
        status: PaymentStatus.PENDING,
      },
    });

    await this.auditService.record({
      action: 'PAYMENT_INITIATED',
      actor: { id: user.id, role: user.role },
      resourceType: 'Payment',
      resourceId: payment.id,
      metadata: { policyId, amount: policy.premiumAmount, stripeSessionId: session.id },
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      this.logger.error('Stripe or webhook secret not configured');
      throw new ServiceUnavailableException('Payments not configured');
    }

    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Invalid webhook signature: ${err.message}`);
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        await this.handlePaymentFailed(session);
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: any) {
    const policyId = session.metadata?.policyId;
    const stripePaymentId = session.payment_intent as string;

    if (!policyId) {
      this.logger.error('No policyId found in session metadata');
      return;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!payment || payment.status !== PaymentStatus.PENDING) {
      this.logger.log(`Payment already processed or not found for session ${session.id}`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          stripePaymentId,
        },
      });

      // 2. Update Policy status
      await tx.policy.update({
        where: { id: policyId },
        data: {
          status: PolicyStatus.ACTIVE,
        },
      });
    });

    await this.auditService.record({
      action: 'PAYMENT_SUCCEEDED',
      actor: null,
      resourceType: 'Payment',
      resourceId: payment.id,
      metadata: { policyId, stripePaymentId, sessionId: session.id },
    });

    await this.auditService.record({
      action: 'POLICY_ACTIVATED',
      actor: null,
      resourceType: 'Policy',
      resourceId: policyId,
      metadata: { paymentId: payment.id },
    });

    // 3. Fetch full policy data for email
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { user: true, product: true },
    });

    if (policy) {
      try {
        await this.emailService.sendPolicyActivated(policy.user.email, {
          policyNumber: policy.policyNumber,
          productName: policy.product.name,
          startDate: policy.startDate,
          endDate: policy.endDate,
          amount: policy.premiumAmount,
        });
      } catch (err) {
        this.logger.error(`Failed to send activation email for policy ${policyId}`, err);
      }
    }
  }

  private async handlePaymentFailed(session: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (payment && payment.status === PaymentStatus.PENDING) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      await this.auditService.record({
        action: 'PAYMENT_FAILED',
        actor: null,
        resourceType: 'Payment',
        resourceId: payment.id,
        metadata: { sessionId: session.id, reason: 'expired or async failure' },
      });

      this.logger.log(`Payment failed/expired for session ${session.id}`);
    }
  }
}
