import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../prisma/safe-user-select';
import { MlClientService } from '../ml-client/ml-client.service';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { Prisma, UserRole, ClaimStatus } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user';
import { FraudResponseDto } from '../ml-client/dto/fraud-response.dto';

@Injectable()
export class ClaimsService {
  private readonly ALLOWED_MIME = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(user: AuthUser, pagination: { limit: number; offset: number }) {
    let where: Prisma.ClaimWhereInput = {};

    if (user.role === UserRole.CUSTOMER) {
      where = { userId: user.id };
    } else if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException(
          'COMPANY_ADMIN account is missing companyId',
        );
      }
      where = { application: { product: { companyId: user.companyId } } };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.claim.findMany({
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
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset,
      }),
      this.prisma.claim.count({ where }),
    ]);

    return { items, total };
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
        documents: { orderBy: { uploadedAt: 'desc' } },
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
      throw new ForbiddenException(
        'You do not have permission to view this claim',
      );
    }

    // Scoping check: COMPANY_ADMIN can only see claims for their company
    if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException(
          'COMPANY_ADMIN account is missing companyId',
        );
      }
      if (claim.application.product.companyId !== user.companyId) {
        throw new ForbiddenException(
          'You do not have permission to view this claim',
        );
      }
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
        include: { application: { include: { product: true } } },
      });

      if (!policy) {
        throw new NotFoundException(`Policy with ID ${policyId} not found`);
      }

      if (policy.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Claims can only be filed against ACTIVE policies. Current status: ${policy.status}`,
        );
      }

      finalUserId = policy.userId;
      finalApplicationId = policy.applicationId;

      // Safety check: ensure policy belongs to user
      if (finalUserId !== userId) {
        throw new ForbiddenException(
          'You can only file claims against your own policies',
        );
      }
    } else {
      // Legacy path / Manual override (still requires applicationId)
      if (!finalApplicationId) {
        throw new BadRequestException(
          'Either policyId or applicationId must be provided',
        );
      }

      // Verify User exists
      const user = await this.prisma.user.findUnique({
        where: { id: finalUserId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${finalUserId} not found`);
      }

      // Verify Application exists and belongs to user
      const application = await this.prisma.application.findUnique({
        where: { id: finalApplicationId },
      });

      if (!application) {
        throw new NotFoundException(
          `Application with ID ${finalApplicationId} not found`,
        );
      }

      // FIX: Add ownership check in legacy path
      if (application.userId !== userId) {
        throw new ForbiddenException(
          'You can only file claims against your own applications',
        );
      }

      if (application.userId !== finalUserId) {
        throw new BadRequestException(
          `Application does not belong to the given user`,
        );
      }
    }

    // 2. Fetch full application for ML service and response
    const application = await this.prisma.application.findUnique({
      where: { id: finalApplicationId },
      include: { product: true },
    });

    if (!application) {
      throw new NotFoundException(
        `Application with ID ${finalApplicationId} not found`,
      );
    }

    // 3. Pre-generate Claim ID for ML service
    const claimId = crypto.randomUUID();

    // 4. Call ML Service for Fraud Detection BEFORE creating anything in DB
    // This ensures we don't have "orphan" claims without fraud assessments
    let fraudResponse: FraudResponseDto;
    try {
      fraudResponse = await this.mlClient.detectFraud({
        claimId: claimId,
        amount,
        claimType: application.product.type,
        description,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Fraud detection failed: ${message}. Claim submission aborted to ensure data consistency.`,
      );
    }

    // 5. Atomic transaction to create Claim and FraudAssessment.
    //
    // Timeout raised to 15s from the 5s default. Under load on Railway's
    // Postgres tier we've seen the transaction trip the 5s deadline while
    // waiting on a free connection from the pool (we cap at connection_limit=10).
    // The actual SQL inside is two INSERTs — sub-100ms work. The extra budget
    // covers pool acquisition + cold-start re-connect, not heavy DB work.
    // Sentry caught a real instance of this in production: see
    // PrismaClientKnownRequestError "Transaction already closed" on POST /claims.
    await this.prisma.$transaction(
      async (tx) => {
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
            flag: fraudResponse.flag,
            explanation: fraudResponse.explanation,
            featureContributions: (fraudResponse.featureContributions ??
              undefined) as Prisma.InputJsonValue,
          },
        });

        return newClaim;
      },
      { timeout: 15_000 },
    );

    const finalClaim = await this._findOneOrThrow(claimId);

    // Send notification
    try {
      await this.emailService.sendClaimFiled(finalClaim.user.email, {
        claimId: finalClaim.id,
        productName: finalClaim.application.product.name,
        amount: finalClaim.amount,
        fraudFlag: finalClaim.fraudAssessments[0]?.flag ?? 'PENDING',
      });
    } catch (error) {
      console.error(
        `Failed to send claim filed email for claim ${claimId}`,
        error,
      );
    }

    await this.auditService.record({
      action: 'CLAIM_FILED',
      actor: {
        id: finalClaim.user.id,
        email: finalClaim.user.email,
        role: finalClaim.user.role,
      },
      resourceType: 'Claim',
      resourceId: finalClaim.id,
      metadata: {
        amount: finalClaim.amount,
        productName: finalClaim.application.product.name,
        fraudFlag: finalClaim.fraudAssessments[0]?.flag ?? 'PENDING',
      },
    });

    // 6. Return fully populated Claim
    return finalClaim;
  }

  async updateStatus(id: string, status: ClaimStatus, user: AuthUser) {
    const claim = await this._findOneOrThrow(id);

    // Scoping check: COMPANY_ADMIN can only update claims for their company
    if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException(
          'COMPANY_ADMIN account is missing companyId',
        );
      }
      if (claim.application.product.companyId !== user.companyId) {
        throw new ForbiddenException(
          'You do not have permission to view this claim',
        );
      }
    }

    await this.prisma.claim.update({
      where: { id },
      data: { status },
    });

    const finalClaim = await this._findOneOrThrow(id);

    await this.auditService.record({
      action: 'CLAIM_STATUS_CHANGED',
      actor: { id: user.id, role: user.role },
      resourceType: 'Claim',
      resourceId: id,
      metadata: { from: claim.status, to: status },
    });

    // Send notifications
    try {
      if (status === 'APPROVED') {
        await this.emailService.sendClaimApproved(finalClaim.user.email, {
          claimId: finalClaim.id,
          productName: finalClaim.application.product.name,
          amount: finalClaim.amount,
        });
      } else if (status === 'DENIED') {
        await this.emailService.sendClaimDenied(finalClaim.user.email, {
          claimId: finalClaim.id,
          productName: finalClaim.application.product.name,
        });
      }
    } catch (error) {
      console.error(`Failed to send claim status email for claim ${id}`, error);
    }

    return finalClaim;
  }

  async uploadDocument(
    claimId: string,
    file: Express.Multer.File,
    user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: ${this.ALLOWED_MIME.join(', ')}`,
      );
    }

    // Scoping check: ensuring user has access to the claim
    await this.findOne(claimId, user);

    const { url } = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const document = await this.prisma.claimDocument.create({
      data: {
        claimId,
        filename: file.originalname,
        url,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: user.id,
      },
    });

    await this.auditService.record({
      action: 'CLAIM_DOCUMENT_UPLOADED',
      actor: { id: user.id, role: user.role },
      resourceType: 'Claim',
      resourceId: claimId,
      metadata: {
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        documentId: document.id,
      },
    });

    return document;
  }

  async listDocuments(claimId: string, user: AuthUser) {
    // Scoping check
    await this.findOne(claimId, user);

    return this.prisma.claimDocument.findMany({
      where: { claimId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploadedBy: { select: safeUserSelect },
      },
    });
  }

  async deleteDocument(claimId: string, docId: string, user: AuthUser) {
    const doc = await this.prisma.claimDocument.findUnique({
      where: { id: docId },
    });

    if (!doc || doc.claimId !== claimId) {
      throw new NotFoundException(
        `Document with ID ${docId} not found for this claim`,
      );
    }

    // Authorization: only uploader or platform admin
    if (doc.uploadedById !== user.id && user.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this document',
      );
    }

    // Extract storage key from URL
    const key = doc.url.split('/uploads/')[1];
    if (key) {
      await this.storageService.deleteFile(key).catch((err) => {
        console.error(
          `Failed to delete physical file for document ${docId}`,
          err,
        );
      });
    }

    await this.prisma.claimDocument.delete({
      where: { id: docId },
    });

    await this.auditService.record({
      action: 'CLAIM_DOCUMENT_DELETED',
      actor: { id: user.id, role: user.role },
      resourceType: 'Claim',
      resourceId: claimId,
      metadata: { documentId: docId, filename: doc.filename },
    });

    return { success: true, id: docId };
  }
}
