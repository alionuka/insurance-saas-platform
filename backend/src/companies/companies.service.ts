import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { AuthUser } from '../auth/types/auth-user';
import { UserRole } from '@prisma/client';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  private readonly ALLOWED_LOGO_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private storage: StorageService,
  ) {}

  async findAll(pagination: { limit: number; offset: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        include: {
          products: true,
        },
        orderBy: [
          // Pending tenants float to the top so admins see review queue
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
        take: pagination.limit,
        skip: pagination.offset,
      }),
      this.prisma.company.count(),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  /**
   * Returns the calling COMPANY_ADMIN's own company, suitable for the
   * branding-settings page.
   */
  async findMyCompany(user: AuthUser) {
    if (!user.companyId) {
      throw new ForbiddenException(
        'Only COMPANY_ADMIN users with an assigned company can use this endpoint',
      );
    }
    return this.findOne(user.companyId);
  }

  /**
   * Approve a tenant pending KYC review. Flips the Company status from
   * PENDING_VERIFICATION to ACTIVE and records the reviewing admin so the
   * decision is audit-traceable. After this, the company-admin user gets
   * full access to product creation, application approvals, etc.
   */
  async approve(id: string, actor: AuthUser) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    if (company.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(
        `Company is not pending verification (current status: ${company.status})`,
      );
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedBy: actor.id,
      },
    });

    await this.audit.record({
      action: 'COMPANY_APPROVED',
      actor: { id: actor.id, role: actor.role },
      resourceType: 'Company',
      resourceId: id,
      metadata: { companyName: updated.name },
    });

    return updated;
  }

  /**
   * Update tenant display fields (name, description, primaryColor). The
   * companyId is taken from the caller for COMPANY_ADMIN, or passed
   * explicitly for PLATFORM_ADMIN.
   */
  async updateCompany(
    companyId: string,
    dto: UpdateCompanyDto,
    actor: AuthUser,
  ) {
    // Scoping: COMPANY_ADMIN may only edit their own company. PLATFORM_ADMIN
    // can edit any.
    if (
      actor.role === UserRole.COMPANY_ADMIN &&
      actor.companyId !== companyId
    ) {
      throw new ForbiddenException(
        'You can only edit your own company',
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.primaryColor !== undefined
          ? { primaryColor: dto.primaryColor }
          : {}),
      },
    });

    await this.audit.record({
      action: 'COMPANY_UPDATED',
      actor: { id: actor.id, role: actor.role },
      resourceType: 'Company',
      resourceId: companyId,
      metadata: { changedFields: Object.keys(dto) },
    });

    return updated;
  }

  /**
   * Upload a tenant logo and persist its URL on the Company row. Image is
   * routed through StorageService — local FS in dev, Cloudflare R2 in prod.
   */
  async uploadLogo(
    companyId: string,
    file: Express.Multer.File,
    actor: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!this.ALLOWED_LOGO_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported logo type: ${file.mimetype}. Allowed: ${this.ALLOWED_LOGO_MIME.join(', ')}`,
      );
    }
    // Logos are user-uploaded but expected to be small (<2MB) — guard so a
    // misclick can't burn the bucket.
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Logo must be smaller than 2 MB');
    }

    if (
      actor.role === UserRole.COMPANY_ADMIN &&
      actor.companyId !== companyId
    ) {
      throw new ForbiddenException('You can only update your own company');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const { url } = await this.storage.uploadFile(
      file.buffer,
      `company-${companyId}-${file.originalname}`,
      file.mimetype,
    );

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: url },
    });

    await this.audit.record({
      action: 'COMPANY_LOGO_UPDATED',
      actor: { id: actor.id, role: actor.role },
      resourceType: 'Company',
      resourceId: companyId,
      metadata: {
        filename: file.originalname,
        sizeBytes: file.size,
        mimeType: file.mimetype,
      },
    });

    return updated;
  }
}
