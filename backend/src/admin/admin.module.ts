import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MlModelsController } from './ml-models.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdminController, MlModelsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
