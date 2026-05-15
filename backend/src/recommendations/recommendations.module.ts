import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MlClientModule } from '../ml-client/ml-client.module';

@Module({
  imports: [PrismaModule, MlClientModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
