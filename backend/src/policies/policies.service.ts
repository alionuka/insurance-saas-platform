import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../prisma/safe-user-select';
import { AuthUser } from '../auth/types/auth-user';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  private async _findOneOrThrow(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        user: { select: safeUserSelect },
        product: {
          include: {
            company: true,
          },
        },
        application: true,
      },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    return policy;
  }

  async findAll(user: AuthUser, pagination: { limit: number; offset: number }) {
    let where: Prisma.PolicyWhereInput = {};

    if (user.role === UserRole.CUSTOMER) {
      where = { userId: user.id };
    } else if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException('COMPANY_ADMIN account is missing companyId');
      }
      where = { product: { companyId: user.companyId } };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.policy.findMany({
        where,
        include: {
          user: { select: safeUserSelect },
          product: {
            include: {
              company: true,
            },
          },
          application: true,
        },
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset,
      }),
      this.prisma.policy.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string, user: AuthUser) {
    const policy = await this._findOneOrThrow(id);

    // Ownership check: CUSTOMER can only see their own policy
    if (user.role === UserRole.CUSTOMER && policy.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this policy');
    }

    // Scoping check: COMPANY_ADMIN can only see policies for their company
    if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException('COMPANY_ADMIN account is missing companyId');
      }
      if (policy.product.companyId !== user.companyId) {
        throw new ForbiddenException('You do not have permission to view this policy');
      }
    }

    return policy;
  }
}
