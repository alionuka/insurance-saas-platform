import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  // Use pino as the application logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Enable global validation using class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('InsurSaaS Platform API')
    .setDescription(
      'Multi-tenant insurance SaaS with ML-powered risk and fraud detection',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access_token',
    )
    .addTag('Auth', 'Registration, login, password management')
    .addTag('Applications', 'Insurance application lifecycle')
    .addTag('Policies', 'Issued policies and coverage')
    .addTag('Claims', 'Claim filing and processing')
    .addTag('Payments', 'Stripe checkout and webhooks')
    .addTag('Products', 'Insurance product catalog')
    .addTag('Companies', 'Insurance providers (tenants)')
    .addTag('Recommendations', 'Personalised product recommendations')
    .addTag('ML', 'Direct ML service proxy endpoints')
    .addTag('Admin', 'Platform admin operations')
    .addTag('Audit', 'Audit log access')
    .addTag('Health', 'Liveness and readiness probes')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Serve static assets (uploaded claim documents)
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS for the Next.js frontend(s). Accepts a comma-separated list
  // in CORS_ORIGINS, falling back to FRONTEND_URL, then localhost for local dev.
  const corsEnv = process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const allowedOrigins = corsEnv.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend application is running on port ${port}`);
}
void bootstrap();
