import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Backward-compatible alias — forwards to /health/live */
  @Get('health')
  healthAlias() {
    return this.healthLive();
  }

  @Get('health/live')
  healthLive() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  async healthReady(@Res() res: Response) {
    const checks: Record<string, 'ok' | 'fail'> = {
      database: 'fail',
      mlService: 'fail',
    };

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      // database unreachable
    }

    // Check ML service with 2-second timeout
    try {
      const response = await fetch(`${ML_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        checks.mlService = 'ok';
      }
    } catch {
      // ml service unreachable or timed out
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    const status = allOk ? 'ok' : 'degraded';
    const httpStatus = allOk ? 200 : 503;

    res.status(httpStatus).json({
      status,
      checks,
      timestamp: new Date().toISOString(),
    });
  }
}
