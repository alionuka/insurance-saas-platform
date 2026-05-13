import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: { limit: number; offset: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        include: {
          products: true,
        },
        orderBy: { createdAt: 'desc' },
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
}
