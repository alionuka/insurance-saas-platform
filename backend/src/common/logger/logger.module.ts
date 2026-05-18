import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        genReqId: () => randomUUID(),
        serializers: {
          req: (
            req: IncomingMessage & {
              id?: string;
              raw?: { user?: { sub?: string } };
            },
          ) => ({
            method: req.method,
            url: req.url,
            requestId: req.id,
            userId: req.raw?.user?.sub ?? undefined,
          }),
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            '*.password',
            '*.passwordHash',
          ],
          censor: '[REDACTED]',
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              }
            : undefined,
        level: process.env.LOG_LEVEL ?? 'info',
      },
    }),
  ],
})
export class LoggerModule {}
