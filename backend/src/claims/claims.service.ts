import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../prisma/safe-user-select';
import { MlClientService } from '../ml-client/ml-client.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UserRole, ClaimStatus } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
  ) {}

  async findAll(user: AuthUser) {
    const where = user.role === UserRole.CUSTOMER ? { userId: user.id } : {};

    return this.prisma.claim.findMany({
      where,
      include: {
        user: { select: safeUserSelect },
        application: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        policy: true,
        fraudAssessments: true,
      },
    });
  }

  private async _findOneOrThrow(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        user: { select: safeUserSelect },
        application: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        policy: true,
        fraudAssessments: true,
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    return claim;
  }

  async findOne(id: string, user: AuthUser) {
    const claim = await this._findOneOrThrow(id);

    // Ownership check: CUSTOMER can only see their own claim
    if (user.role === UserRole.CUSTOMER && claim.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this claim');
    }

    return claim;
  }

  async create(dto: CreateClaimDto, userId: string) {
    const { applicationId, policyId, amount, description } = dto;

    let finalUserId = userId;
    let finalApplicationId = applicationId;

    // 1. If policyId is provided, derive IDs and verify status
    if (policyId) {
      const policy = await this.prisma.policy.findUnique({
        where: { id: policyId },
        include: { application: { include: { product: true } } }
      });

      if (!policy) {
        throw new NotFoundException(`Policy with ID ${policyId} not found`);
      }

      if (policy.status !== 'ACTIVE') {
        throw new BadRequestException(`Claims can only be filed against ACTIVE policies. Current status: ${policy.status}`);
      }

      finalUserId = policy.userId;
      finalApplicationId = policy.applicationId;
      
      // Safety check: ensure policy belongs to user
      if (finalUserId !== userId) {
        throw new ForbiddenException('You can only file claims against your own policies');
      }
    } else {
      // Legacy path / Manual override (still requires applicationId)
      if (!finalApplicationId) {
        throw new BadRequestException('Either policyId or applicationId must be provided');
      }

      // Verify User exists
      const user = await this.prisma.user.findUnique({ where: { id: finalUserId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${finalUserId} not found`);
      }

      // Verify Application exists and belongs to user
      const application = await this.prisma.application.findUnique({
        where: { id: finalApplicationId },
      });
      
      if (!application) {
        throw new NotFoundException(`Application with ID ${finalApplicationId} not found`);
      }
      
      // FIX: Add ownership check in legacy path
      if (application.userId !== userId) {
        throw new ForbiddenException('You can only file claims against your own applications');
      }

      if (application.userId !== finalUserId) {
        throw new BadRequestException(`Application does not belong to the given user`);
      }
    }

    // 2. Fetch full application for ML service and response
    const application = await this.prisma.application.findUnique({
      where: { id: finalApplicationId },
      include: { product: true }
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${finalApplicationId} not found`);
    }

    // 3. Pre-generate Claim ID for ML service
    const claimId = crypto.randomUUID();

    // 4. Call ML Service for Fraud Detection BEFORE creating anything in DB
    // This ensures we don't have "orphan" claims without fraud assessments
    let fraudResponse;
    try {
      fraudResponse = await this.mlClient.detectFraud({
        claimId: claimId,
        amount,
        claimType: application.product.type,
        description,
      });
    } catch (error) {
      throw new BadRequestException(`Fraud detection failed: ${error.message}. Claim submission aborted to ensure data consistency.`);
    }

    // 5. Atomic transaction to create Claim and FraudAssessment
    await this.prisma.$transaction(async (tx) => {
      const newClaim = await tx.claim.create({
        data: {
          id: claimId,
          userId: finalUserId,
          applicationId: finalApplicationId,
          policyId,
          amount,
          description,
          status: 'FILED',
        },
      });

      await tx.fraudAssessment.create({
        data: {
          claimId: newClaim.id,
          fraudScore: fraudResponse.fraudScore,
          flag: fraudResponse.flag as any,
          explanation: fraudResponse.explanation,
        },
      });

      return newClaim;
    });

    // 6. Return fully populated Claim
    return this._findOneOrThrow(claimId);
  }

  async updateStatus(id: string, status: ClaimStatus) {
    await this._findOneOrThrow(id);

    await this.prisma.claim.update({
      where: { id },
      data: { status },
    });

    return this._findOneOrThrow(id);
  }
}
