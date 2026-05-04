import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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
}
