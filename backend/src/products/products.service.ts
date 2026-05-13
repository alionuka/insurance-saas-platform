import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlClientService } from '../ml-client/ml-client.service';
import { CreateProductDto } from './dto/create-product.dto';
import { AuthUser } from '../auth/types/auth-user';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private mlClient: MlClientService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.insuranceProduct.findMany({
      include: {
        company: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto, user: AuthUser) {
    let finalCompanyId: string;

    if (user.role === UserRole.COMPANY_ADMIN) {
      if (!user.companyId) {
        throw new ForbiddenException('COMPANY_ADMIN account is missing companyId');
      }
      finalCompanyId = user.companyId;
    } else if (user.role === UserRole.PLATFORM_ADMIN) {
      if (!dto.companyId) {
        throw new BadRequestException('companyId is required for PLATFORM_ADMIN');
      }
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });
      if (!company) {
        throw new NotFoundException(`Company with ID ${dto.companyId} not found`);
      }
      finalCompanyId = dto.companyId;
    } else {
      throw new ForbiddenException('Insufficient permissions to create products');
    }

    const product = await this.prisma.insuranceProduct.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        basePremium: dto.basePremium,
        companyId: finalCompanyId,
      },
      include: {
        company: true,
      },
    });

    await this.auditService.record({
      action: 'PRODUCT_CREATED',
      actor: { id: user.id, role: user.role },
      resourceType: 'Product',
      resourceId: product.id,
      metadata: { name: dto.name, type: dto.type, basePremium: dto.basePremium, companyId: finalCompanyId },
    });

    return product;
  }

  async listMyCompany(user: AuthUser) {
    if (!user.companyId) {
      throw new ForbiddenException('COMPANY_ADMIN account is missing companyId');
    }

    return this.prisma.insuranceProduct.findMany({
      where: { companyId: user.companyId },
      include: {
        company: true,
      },
    });
  }

  async quote(productId: string, user: AuthUser) {
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      throw new NotFoundException(`User with ID ${user.id} not found`);
    }

    let riskScore = 50;
    let riskLevel = 'MEDIUM';
    let riskMultiplier = 1.0;
    let explanation = 'Risk model unavailable; base premium applied';

    try {
      const riskData = await this.mlClient.predictRisk({
        clientId: user.id,
        age: dbUser.age || 30,
        annualIncome: dbUser.annualIncome || 50000,
        creditScore: dbUser.creditScore || 650,
      });

      riskScore = riskData.riskScore;
      riskLevel = riskData.riskLevel;
      explanation = riskData.explanation;

      // Compute: rawMultiplier = 1 + (riskScore - 50) / 100. Clamp to [0.5, 2.0]
      const rawMultiplier = 1 + (riskScore - 50) / 100;
      riskMultiplier = Math.max(0.5, Math.min(2.0, rawMultiplier));
    } catch (err) {
      console.warn('ML Risk Prediction failed for quote:', err);
      // Defaults already set
    }

    const monthlyPremium = Math.round(product.basePremium * riskMultiplier * 100) / 100;

    return {
      productId,
      productName: product.name,
      basePremium: product.basePremium,
      riskScore,
      riskLevel,
      riskMultiplier,
      monthlyPremium,
      explanation,
    };
  }
}
