import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlClientService } from '../ml-client/ml-client.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
  ) {}

  async findAll() {
    return this.prisma.application.findMany({
      include: {
        user: true,
        product: {
          include: {
            company: true,
          },
        },
        riskAssessments: true,
      },
    });
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        product: {
          include: {
            company: true,
          },
        },
        riskAssessments: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async create(dto: CreateApplicationDto) {
    const { userId, productId } = dto;

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
    return this.findOne(application.id);
  }

  // Note: This method is temporary and will be replaced by auth-based user detection later.
  async createDemo(productId: string) {
    const email = 'alice.customer@example.com';
    const demoUser = await this.prisma.user.findUnique({ where: { email } });
    if (!demoUser) {
      throw new NotFoundException(`Demo user with email ${email} not found`);
    }

    return this.create({ userId: demoUser.id, productId });
  }

  async updateStatus(id: string, status: any) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    await this.prisma.application.update({
      where: { id },
      data: { status },
    });

    return this.findOne(id);
  }
}
