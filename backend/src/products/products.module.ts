import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MlClientModule } from '../ml-client/ml-client.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [MlClientModule, AuditModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
