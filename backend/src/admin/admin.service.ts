import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { safeUserSelect } from '../prisma/safe-user-select';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/types/auth-user';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createUser(dto: CreateUserDto, actor: AuthUser) {
    const { email, password, firstName, lastName, role, companyId } = dto;

    // 1. Validation: COMPANY_ADMIN requires companyId
    if (role === UserRole.COMPANY_ADMIN && !companyId) {
      throw new BadRequestException('companyId is required for COMPANY_ADMIN');
    }

    // 2. Validation: Verify Company exists if companyId is provided
    let finalCompanyId: string | null = null;
    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      // Only COMPANY_ADMIN belongs to a single tenant
      if (role === UserRole.COMPANY_ADMIN) {
        finalCompanyId = companyId;
      }
    }

    // 3. Validation: Email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create user
    const newUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        companyId: finalCompanyId,
      },
      select: safeUserSelect,
    });

    await this.auditService.record({
      action: 'STAFF_USER_PROVISIONED',
      actor: { id: actor.id, role: actor.role },
      resourceType: 'User',
      resourceId: newUser.id,
      metadata: { email: dto.email, role: dto.role, companyId: finalCompanyId },
    });

    return newUser;
  }

  async listUsers(
    filters: { role?: UserRole; companyId?: string },
    pagination: { limit: number; offset: number },
  ) {
    const where: Prisma.UserWhereInput = {};
    if (filters.role) where.role = filters.role;
    if (filters.companyId) where.companyId = filters.companyId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: { ...safeUserSelect, company: true },
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        applications: {
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
        claims: {
          orderBy: { createdAt: 'desc' },
        },
        policies: {
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Strip passwordHash
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
