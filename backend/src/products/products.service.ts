import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlClientService } from '../ml-client/ml-client.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthUser } from '../auth/types/auth-user';
import { UserRole, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';

const PRODUCTS_CACHE_PREFIX = 'products:list:';
const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private mlClient: MlClientService,
    private auditService: AuditService,
    private cache: CacheService,
  ) {}

  async findAll(pagination: { limit: number; offset: number }) {
    // Cache catalog listings — product data rarely changes between requests
    // and the same pagination is hit by every visitor on the landing page.
    const cacheKey = `${PRODUCTS_CACHE_PREFIX}${pagination.limit}:${pagination.offset}`;
    return this.cache.wrap(cacheKey, PRODUCTS_CACHE_TTL_MS, async () => {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.insuranceProduct.findMany({
          include: {
            company: true,
          },
          orderBy: { createdAt: 'desc' },
          take: pagination.limit,
          skip: pagination.offset,
        }),
        this.prisma.insuranceProduct.count(),
      ]);
      return { items, total };
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
        throw new ForbiddenException(
          'COMPANY_ADMIN account is missing companyId',
        );
      }
      finalCompanyId = user.companyId;
    } else if (user.role === UserRole.PLATFORM_ADMIN) {
      if (!dto.companyId) {
        throw new BadRequestException(
          'companyId is required for PLATFORM_ADMIN',
        );
      }
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });
      if (!company) {
        throw new NotFoundException(
          `Company with ID ${dto.companyId} not found`,
        );
      }
      finalCompanyId = dto.companyId;
    } else {
      throw new ForbiddenException(
        'Insufficient permissions to create products',
      );
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
      metadata: {
        name: dto.name,
        type: dto.type,
        basePremium: dto.basePremium,
        companyId: finalCompanyId,
      },
    });

    this.cache.invalidatePrefix(PRODUCTS_CACHE_PREFIX);
    return product;
  }

  async listMyCompany(
    user: AuthUser,
    pagination: { limit: number; offset: number },
  ) {
    if (!user.companyId) {
      throw new ForbiddenException(
        'COMPANY_ADMIN account is missing companyId',
      );
    }

    const where = { companyId: user.companyId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceProduct.findMany({
        where,
        include: {
          company: true,
        },
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset,
      }),
      this.prisma.insuranceProduct.count({ where }),
    ]);

    return { items, total };
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

    const monthlyPremium =
      Math.round(product.basePremium * riskMultiplier * 100) / 100;

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

  async update(id: string, dto: UpdateProductDto, user: AuthUser) {
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (user.role === UserRole.COMPANY_ADMIN) {
      if (product.companyId !== user.companyId) {
        throw new ForbiddenException(
          'You do not have permission to update this product',
        );
      }
    } else if (user.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'Insufficient permissions to update products',
      );
    }

    const dataToUpdate: Prisma.InsuranceProductUpdateInput = {};
    const allowedKeys: (keyof UpdateProductDto)[] = [
      'name',
      'description',
      'basePremium',
      'type',
    ];

    for (const key of allowedKeys) {
      if (dto[key] !== undefined) {
        const val = dto[key];
        if (key === 'name' || key === 'description' || key === 'type') {
          dataToUpdate[key] = val as string;
        } else if (key === 'basePremium') {
          dataToUpdate[key] = val as number;
        }
      }
    }

    const updatedProduct = await this.prisma.insuranceProduct.update({
      where: { id },
      data: dataToUpdate,
      include: {
        company: true,
      },
    });

    await this.auditService.record({
      action: 'PRODUCT_UPDATED',
      actor: { id: user.id, role: user.role },
      resourceType: 'InsuranceProduct',
      resourceId: id,
      metadata: { changedFields: Object.keys(dataToUpdate) },
    });

    this.cache.invalidatePrefix(PRODUCTS_CACHE_PREFIX);
    return updatedProduct;
  }

  async remove(id: string, user: AuthUser) {
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (user.role === UserRole.COMPANY_ADMIN) {
      if (product.companyId !== user.companyId) {
        throw new ForbiddenException(
          'You do not have permission to delete this product',
        );
      }
    } else if (user.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'Insufficient permissions to delete products',
      );
    }

    // Count related applications and policies
    const [appCount, policyCount] = await Promise.all([
      this.prisma.application.count({ where: { productId: id } }),
      this.prisma.policy.count({ where: { productId: id } }),
    ]);

    if (appCount > 0 || policyCount > 0) {
      throw new ConflictException(
        `Cannot delete: product has ${appCount} applications and ${policyCount} policies linked to it`,
      );
    }

    await this.prisma.insuranceProduct.delete({
      where: { id },
    });

    await this.auditService.record({
      action: 'PRODUCT_DELETED',
      actor: { id: user.id, role: user.role },
      resourceType: 'InsuranceProduct',
      resourceId: id,
      metadata: { name: product.name },
    });

    this.cache.invalidatePrefix(PRODUCTS_CACHE_PREFIX);
    return { success: true };
  }
}
