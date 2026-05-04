import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductsModule } from './products/products.module';
import { ApplicationsModule } from './applications/applications.module';
import { PoliciesModule } from './policies/policies.module';
import { ClaimsModule } from './claims/claims.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MlClientModule } from './ml-client/ml-client.module';

@Module({
  imports: [AuthModule, UsersModule, CompaniesModule, ProductsModule, ApplicationsModule, PoliciesModule, ClaimsModule, AnalyticsModule, MlClientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
