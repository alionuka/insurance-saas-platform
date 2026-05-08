import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../prisma/safe-user-select';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.policy.findMany({
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
  }

  async findOne(id: string) {
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
}
