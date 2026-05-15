import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlClientService } from '../ml-client/ml-client.service';
import { AuthUser } from '../auth/types/auth-user';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
  ) {}

  /**
   * Build a personalised product recommendation for the calling customer.
   *
   * Demographic features (age, annualIncome) come from the User row.
   * Life events are derived from the customer's existing applications and
   * policies — the customer's product mix is a useful implicit signal of
   * what they care about. For a customer with no history, the recommender
   * still works on demographic cues alone.
   */
  async getForCustomer(user: AuthUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        applications: { include: { product: true } },
        policies: { include: { product: true } },
      },
    });

    if (!dbUser) {
      throw new NotFoundException(`User with ID ${user.id} not found`);
    }

    // Derive simple life-event hints from the customer's existing records.
    // These are the literal strings the ML service knows how to interpret.
    const lifeEvents = new Set<string>();
    const ownedTypes = new Set<string>();
    for (const a of dbUser.applications) {
      ownedTypes.add(a.product.type);
    }
    for (const p of dbUser.policies) {
      ownedTypes.add(p.product.type);
    }

    if (ownedTypes.has('AUTO')) lifeEvents.add('new_car');
    if (ownedTypes.has('HEALTH')) lifeEvents.add('child');
    if (ownedTypes.has('PROPERTY')) lifeEvents.add('new_home');
    if (ownedTypes.has('LIFE')) lifeEvents.add('marriage');

    const dto = {
      clientId: dbUser.id,
      age: dbUser.age ?? 30,
      annualIncome: dbUser.annualIncome ?? 50000,
      lifeEvents: Array.from(lifeEvents),
      topK: 3,
    };

    return this.mlClient.getRecommendations(dto);
  }
}
