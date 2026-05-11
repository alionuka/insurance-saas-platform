import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../prisma/safe-user-select';
import { MlClientService } from '../ml-client/ml-client.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UserRole, ApplicationStatus } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
  ) {}

  async findAll(user: AuthUser) {
    const where = user.role === UserRole.CUSTOMER ? { userId: user.id } : {};

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

    // 6. Return fully populated Application
    return this._findOneOrThrow(application.id);
  }

  async updateStatus(id: string, status: ApplicationStatus) {
    const application = await this._findOneOrThrow(id);

    await this.prisma.application.update({
      where: { id },
      data: { status },
    });

    // Auto-create policy when application is approved (idempotent)
    if (status === 'APPROVED' && !application.policy) {
      const policyNumber = `POL-${id.slice(0, 8).toUpperCase()}`;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      await this.prisma.policy.create({
        data: {
          policyNumber,
          userId: application.userId,
          productId: application.productId,
          applicationId: id,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });
    }

    return this._findOneOrThrow(id);
  }
}
