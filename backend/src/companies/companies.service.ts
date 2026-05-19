import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/types/auth-user';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
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
}
