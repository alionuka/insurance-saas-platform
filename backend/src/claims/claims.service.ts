import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlClientService } from '../ml-client/ml-client.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { DemoClaimDto } from './dto/demo-claim.dto';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
  ) {}

  async findAll() {
    return this.prisma.claim.findMany({
      include: {
        user: true,
        application: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        fraudAssessments: true,
      },
    });
  }

  async findOne(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        user: true,
        application: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        fraudAssessments: true,
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    return claim;
  }

  async create(dto: CreateClaimDto) {
    const { userId, applicationId, amount, description } = dto;

    // 1. Verify User exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Verify Application exists and belongs to user
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { product: true }
    });
    
    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }
    if (application.userId !== userId) {
      throw new BadRequestException(`Application does not belong to the given user`);
    }

    // 3. Create Claim (FILED status is default)
    const claim = await this.prisma.claim.create({
      data: {
        userId,
        applicationId,
        amount,
        description,
        status: 'FILED',
      },
    });

    // 4. Call ML Service for Fraud Detection
    const fraudResponse = await this.mlClient.detectFraud({
      claimId: claim.id,
      amount: claim.amount,
      claimType: application.product.type, // passing product type as claimType
      description: claim.description,
    });

    // 5. Save FraudAssessment
    await this.prisma.fraudAssessment.create({
      data: {
        claimId: claim.id,
        fraudScore: fraudResponse.fraudScore,
        flag: fraudResponse.flag as any, // assuming it aligns with FraudFlag enum (NORMAL, SUSPICIOUS)
        explanation: fraudResponse.explanation,
      },
    });

    // 6. Return fully populated Claim
    return this.findOne(claim.id);
  }

  // Temporary demo endpoint
  async createDemo(dto: DemoClaimDto) {
    const email = 'alice.customer@example.com';
    const demoUser = await this.prisma.user.findUnique({ 
      where: { email },
      include: {
        applications: true
      }
    });

    if (!demoUser) {
      throw new NotFoundException(`Demo user with email ${email} not found`);
    }

    if (demoUser.applications.length === 0) {
      throw new BadRequestException(`Demo user has no applications to file a claim against. Apply for a product first.`);
    }

    // Pick the first application for demo purposes
    const targetApplication = demoUser.applications[0];

    return this.create({
      userId: demoUser.id,
      applicationId: targetApplication.id,
      amount: dto.amount,
      description: dto.description
    });
  }

  async updateStatus(id: string, status: any) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    await this.prisma.claim.update({
      where: { id },
      data: { status },
    });

    return this.findOne(id);
  }
}
