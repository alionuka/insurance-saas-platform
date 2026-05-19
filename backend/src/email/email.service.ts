import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    if (apiKey) {
      // Wrap Resend's emails.send to dispatch asynchronously with retry.
      // This way every existing call site stays the same — `await this.resend!.emails.send(...)`
      // returns immediately, while the actual network call runs in the
      // background with exponential-backoff retries. No BullMQ / Redis needed.
      const raw = new Resend(apiKey);
      const originalSend = raw.emails.send.bind(raw.emails);
      const dispatchAsync = this.dispatchAsync.bind(this);
      raw.emails.send = ((args: any) => {
        dispatchAsync('emails.send', () => originalSend(args));
        // Return a resolved promise so call sites that `await` don't block.
        return Promise.resolve({ data: null, error: null } as any);
      }) as typeof raw.emails.send;
      this.resend = raw;
    } else {
      this.logger.warn(
        'RESEND_API_KEY not set; password reset emails will be logged to console only.',
      );
    }
  }

  /**
   * Detach an email send from the request lifecycle. Retries up to 3 times
   * with exponential backoff (500ms → 1s → 2s). Failures are logged but
   * never thrown — email is best-effort.
   */
  private dispatchAsync(label: string, fn: () => Promise<unknown>): void {
    // setImmediate expects a `() => void` callback; wrap the async runner in
    // a void-returning closure so ESLint's no-misused-promises rule is
    // satisfied and stray rejections inside the IIFE bubble to .catch below.
    const runWithRetry = async (): Promise<void> => {
      const maxAttempts = 3;
      let attempt = 0;
      let delayMs = 500;
      while (attempt < maxAttempts) {
        try {
          await fn();
          return;
        } catch (err) {
          attempt++;
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `${label} attempt ${attempt}/${maxAttempts} failed: ${msg}`,
          );
          if (attempt >= maxAttempts) {
            this.logger.error(
              `${label} permanently failed after ${maxAttempts} attempts`,
            );
            return;
          }
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs *= 2;
        }
      }
    };
    setImmediate(() => {
      runWithRetry().catch((err) => {
        // Should never get here — runWithRetry catches its own errors.
        this.logger.error(`${label} dispatch loop crashed`, err);
      });
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(
        `\n[EmailService] Password reset URL for ${to}: ${resetUrl}\n`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Reset your InsurSaaS password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">Reset Your Password</h2>
            <p>You requested to reset your password for your InsurSaaS account. Click the button below to set a new password:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${resetUrl}</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }

  async sendApplicationApproved(
    to: string,
    data: {
      applicationId: string;
      productName: string;
      policyNumber?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<void> {
    const summary = `Application ${data.applicationId} approved. Product: ${data.productName}. Policy: ${data.policyNumber || 'N/A'}`;
    if (!this.resend) {
      this.logger.log(
        `[EmailService] Application Approved for ${to}: ${summary}`,
      );
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Your insurance application was approved',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Application Approved</h2>
          <p>Great news! Your application for <strong>${data.productName}</strong> has been approved.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Policy Number:</strong> ${data.policyNumber || 'Pending'}</p>
            <p style="margin: 0 0 10px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
            ${data.startDate ? `<p style="margin: 0 0 10px 0;"><strong>Coverage Starts:</strong> ${data.startDate.toLocaleDateString()}</p>` : ''}
            ${data.endDate ? `<p style="margin: 0;"><strong>Coverage Ends:</strong> ${data.endDate.toLocaleDateString()}</p>` : ''}
          </div>
          <p>You can now view your active policy and manage your coverage in the client portal.</p>
          <p>Thank you for choosing InsurSaaS.</p>
        </div>
      `,
    });
  }

  async sendApplicationRejected(
    to: string,
    data: { applicationId: string; productName: string },
  ): Promise<void> {
    const summary = `Application ${data.applicationId} rejected. Product: ${data.productName}`;
    if (!this.resend) {
      this.logger.log(
        `[EmailService] Application Rejected for ${to}: ${summary}`,
      );
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Update on your insurance application',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Application Update</h2>
          <p>Thank you for your interest in <strong>${data.productName}</strong>.</p>
          <p>After a careful review of your application (ID: ${data.applicationId}), we regret to inform you that we are unable to approve your request at this time.</p>
          <p>If you have any questions regarding this decision, please contact our support team.</p>
        </div>
      `,
    });
  }

  async sendClaimFiled(
    to: string,
    data: {
      claimId: string;
      productName: string;
      amount: number;
      fraudFlag: string;
    },
  ): Promise<void> {
    const summary = `Claim ${data.claimId} filed. Amount: $${data.amount}. Status: ${data.fraudFlag}`;
    if (!this.resend) {
      this.logger.log(`[EmailService] Claim Filed for ${to}: ${summary}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'We received your claim',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Claim Received</h2>
          <p>We have received your claim for <strong>${data.productName}</strong> and it is now being processed.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Claim ID:</strong> ${data.claimId}</p>
            <p style="margin: 0 0 10px 0;"><strong>Claimed Amount:</strong> $${data.amount.toFixed(2)}</p>
            <p style="margin: 0;"><strong>Initial Status:</strong> ${data.fraudFlag}</p>
          </div>
          <p>Our adjusters will review the details and provide an update shortly. You can track the status of your claim in the dashboard.</p>
        </div>
      `,
    });
  }

  async sendClaimApproved(
    to: string,
    data: { claimId: string; productName: string; amount: number },
  ): Promise<void> {
    const summary = `Claim ${data.claimId} approved. Amount: $${data.amount}`;
    if (!this.resend) {
      this.logger.log(`[EmailService] Claim Approved for ${to}: ${summary}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Your claim has been approved',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Claim Approved</h2>
          <p>Your claim (ID: ${data.claimId}) for <strong>${data.productName}</strong> has been approved for payment.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Approved Amount:</strong> $${data.amount.toFixed(2)}</p>
            <p style="margin: 0;"><strong>Product:</strong> ${data.productName}</p>
          </div>
          <p>The funds will be processed according to your account's preferred payment method. Please allow 3-5 business days for the transaction to complete.</p>
        </div>
      `,
    });
  }

  async sendClaimDenied(
    to: string,
    data: { claimId: string; productName: string },
  ): Promise<void> {
    const summary = `Claim ${data.claimId} denied. Product: ${data.productName}`;
    if (!this.resend) {
      this.logger.log(`[EmailService] Claim Denied for ${to}: ${summary}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Update on your claim',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Claim Update</h2>
          <p>We have completed the review of your claim (ID: ${data.claimId}) for <strong>${data.productName}</strong>.</p>
          <p>We regret to inform you that we are unable to approve your claim at this time based on the documentation provided.</p>
          <p>You can view more details regarding this decision in the client portal. If you have additional information to provide, you may file an appeal through the dashboard.</p>
        </div>
      `,
    });
  }

  async sendPolicyActivated(
    to: string,
    data: {
      policyNumber: string;
      productName: string;
      startDate: Date;
      endDate: Date;
      amount: number;
    },
  ): Promise<void> {
    const summary = `Policy ${data.policyNumber} activated. Paid $${data.amount} for ${data.productName}`;
    if (!this.resend) {
      this.logger.log(`[EmailService] Policy Activated for ${to}: ${summary}`);
      return;
    }

    const formatDate = (d: Date) =>
      new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Your insurance policy is now active',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Your policy is active</h2>
          <p>Payment received. Your <strong>${data.productName}</strong> policy is now active.</p>
          <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Policy number:</strong> ${data.policyNumber}</p>
            <p style="margin: 4px 0;"><strong>Coverage period:</strong> ${formatDate(data.startDate)} – ${formatDate(data.endDate)}</p>
            <p style="margin: 4px 0;"><strong>Amount paid:</strong> $${data.amount.toFixed(2)}</p>
          </div>
          <p>You can now file claims under this policy from your dashboard.</p>
        </div>
      `,
    });
  }
}
