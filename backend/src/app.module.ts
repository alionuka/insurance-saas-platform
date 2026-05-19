import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from './common/logger/logger.module';
import { CacheModule } from './common/cache.module';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
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
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditModule } from './audit/audit.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

@Module({
  imports: [
    LoggerModule,
    CacheModule,
    SentryModule.forRoot(),
    AuthModule,
    UsersModule,
    CompaniesModule,
    ProductsModule,
    ApplicationsModule,
    PoliciesModule,
    ClaimsModule,
    AnalyticsModule,
    MlClientModule,
    PrismaModule,
    AdminModule,
    PaymentsModule,
    AuditModule,
    RecommendationsModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
    ...(process.env.NODE_ENV === 'test'
      ? []
      : [{ provide: APP_GUARD, useClass: ThrottlerGuard }]),
  ],
})
export class AppModule {}
