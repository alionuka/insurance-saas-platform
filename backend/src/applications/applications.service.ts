import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../prisma/safe-user-select';
import { MlClientService } from '../ml-client/ml-client.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Prisma, UserRole, ApplicationStatus } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(user: AuthUser) {
    let where: Prisma.ApplicationWhereInput = {};

    if (user.role === UserRole.CUSTOMER) {
      where = { userId: user.id };
    } else if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException('COMPANY_ADMIN account is missing companyId');
      }
      where = { product: { companyId: user.companyId } };
    }

    return this.prisma.application.findMany({
      where,
      include: {
        user: { select: safeUserSelect },
        product: {
          include: {
            company: true,
          },
        },
        riskAssessments: true,
        policy: true,
      },
    });
  }

  private async _findOneOrThrow(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        user: { select: safeUserSelect },
        product: {
          include: {
            company: true,
          },
        },
        riskAssessments: true,
        policy: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async findOne(id: string, user: AuthUser) {
    const application = await this._findOneOrThrow(id);

    // Ownership check: CUSTOMER can only see their own application
    if (user.role === UserRole.CUSTOMER && application.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this application');
    }

    // Scoping check: COMPANY_ADMIN can only see applications for their company
    if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException('COMPANY_ADMIN account is missing companyId');
      }
      if (application.product.companyId !== user.companyId) {
        throw new ForbiddenException('You do not have permission to view this application');
      }
    }

    return application;
  }

  async create(dto: CreateApplicationDto, userId: string) {
    const { productId } = dto;

    // 1. Verify User exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Verify Product exists
    const product = await this.prisma.insuranceProduct.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // 3. Create Application (PENDING status is default from Prisma schema)
    const application = await this.prisma.application.create({
      data: {
        userId,
        productId,
        status: 'PENDING',
      },
    });

    // 4. Call ML Service
    const mlRiskResponse = await this.mlClient.predictRisk({
      clientId: user.id,
      age: user.age || 30, // Defaulting if null
      annualIncome: user.annualIncome || 50000, // Defaulting if null
      creditScore: user.creditScore || 650, // Defaulting if null
    });

    // 5. Save RiskAssessment
    await this.prisma.riskAssessment.create({
      data: {
        applicationId: application.id,
        riskScore: mlRiskResponse.riskScore,
        riskLevel: mlRiskResponse.riskLevel as any, // Enum mapping if needed, assuming they match exactly
        explanation: mlRiskResponse.explanation,
      },
    });

    // 6. Record Audit
    await this.auditService.record({
      action: 'APPLICATION_CREATED',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'Application',
      resourceId: application.id,
      metadata: { productId, productName: product.name },
    });

    // 7. Return fully populated Application
    return this._findOneOrThrow(application.id);
  }

  async updateStatus(id: string, status: ApplicationStatus, user: AuthUser) {
    const application = await this._findOneOrThrow(id);

    // Scoping check: COMPANY_ADMIN can only update applications for their company
    if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException('COMPANY_ADMIN account is missing companyId');
      }
      if (application.product.companyId !== user.companyId) {
        throw new ForbiddenException('You do not have permission to view this application');
      }
    }

    await this.prisma.application.update({
      where: { id },
      data: { status },
    });

    await this.auditService.record({
      action: 'APPLICATION_STATUS_CHANGED',
      actor: { id: user.id, role: user.role },
      resourceType: 'Application',
      resourceId: id,
      metadata: { from: application.status, to: status },
    });

    // Auto-create policy when application is approved (idempotent)
    if (status === 'APPROVED' && !application.policy) {
      const policyNumber = `POL-${id.slice(0, 8).toUpperCase()}`;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const newPolicy = await this.prisma.policy.create({
        data: {
          policyNumber,
          userId: application.userId,
          productId: application.productId,
          applicationId: id,
          status: 'PENDING_PAYMENT',
          startDate,
          endDate,
          premiumAmount: application.product.basePremium * 12,
        },
      });

      await this.auditService.record({
        action: 'POLICY_CREATED',
        actor: { id: user.id, role: user.role },
        resourceType: 'Policy',
        resourceId: newPolicy.id,
        metadata: { applicationId: id, status: 'PENDING_PAYMENT', premiumAmount: application.product.basePremium * 12 },
      });
    }

    const finalApplication = await this._findOneOrThrow(id);

    // Send notifications
    try {
      if (status === 'APPROVED') {
        await this.emailService.sendApplicationApproved(finalApplication.user.email, {
          applicationId: id,
          productName: finalApplication.product.name,
          policyNumber: finalApplication.policy?.policyNumber,
          startDate: finalApplication.policy?.startDate,
          endDate: finalApplication.policy?.endDate,
        });
      } else if (status === 'REJECTED') {
        await this.emailService.sendApplicationRejected(finalApplication.user.email, {
          applicationId: id,
          productName: finalApplication.product.name,
        });
      }
    } catch (error) {
      // Email is best-effort, don't fail the status update
      console.error(`Failed to send application status email for application ${id}`, error);
    }

    return finalApplication;
  }
}
