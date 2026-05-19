import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

/**
 * Smoke test for the root controller. AppController now also exposes
 * /health/live and /health/ready (added during Tier 2 observability work),
 * which means it depends on PrismaService. We supply a minimal mock so the
 * DI container can instantiate the controller without booting a real DB.
 */
describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('returns landing metadata from the root path', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });

  it('exposes a liveness probe with uptime + timestamp', () => {
    const result = appController.healthLive();
    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
