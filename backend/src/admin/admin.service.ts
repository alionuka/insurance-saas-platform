import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { safeUserSelect } from '../prisma/safe-user-select';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: CreateUserDto) {
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
    return this.prisma.user.create({
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
  }
}
