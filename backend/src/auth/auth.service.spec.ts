import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

/**
 * Unit tests for AuthService — focused on security-critical logic.
 * All external dependencies (Prisma, JWT, Email, Audit) are mocked so each
 * test runs in isolation without database or network.
 */
describe('AuthService (unit)', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  // Fresh mocks for every test to keep them independent
  beforeEach(async () => {
    const prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const jwtMock = {
      sign: jest.fn().mockReturnValue('fake.access.token'),
    };

    const emailMock = {
      sendPasswordResetEmail: jest.fn(),
    };

    const auditMock = {
      record: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: EmailService, useValue: emailMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
    prisma = moduleRef.get(PrismaService) as unknown as jest.Mocked<PrismaService>;
    jwtService = moduleRef.get(JwtService);
  });

  describe('register()', () => {
    it('hashes the password with bcrypt(10) before persisting', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'u1', ...data }),
      );
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      await service.register({
        email: 'new@example.com',
        password: 'StrongPass123!',
        firstName: 'New',
        lastName: 'User',
      } as any);

      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
      const storedHash = createCall.data.passwordHash;

      // Hash must NOT equal the plaintext
      expect(storedHash).not.toBe('StrongPass123!');
      // Hash must be a valid bcrypt hash with cost factor 10
      expect(storedHash).toMatch(/^\$2[aby]\$10\$/);
      // The stored hash must verify against the original password
      expect(await bcrypt.compare('StrongPass123!', storedHash)).toBe(true);
    });

    it('refuses to register an existing email with 409 Conflict', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'taken@example.com',
      });

      await expect(
        service.register({
          email: 'taken@example.com',
          password: 'whatever',
          firstName: 'A',
          lastName: 'B',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);

      // Must not attempt to create a user when email is taken
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('forces role=CUSTOMER even if a privileged role is attempted', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'u1', ...data }),
      );
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      await service.register({
        email: 'sneaky@example.com',
        password: 'pass1234',
        firstName: 'S',
        lastName: 'N',
        // Even if a DTO leak lets through extra fields, the service must ignore them
        role: 'PLATFORM_ADMIN',
      } as any);

      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.role).toBe('CUSTOMER');
    });
  });

  describe('login()', () => {
    it('returns access_token + refresh_token + user on valid credentials', async () => {
      const password = 'CorrectPass123!';
      const passwordHash = await bcrypt.hash(password, 10);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash,
        role: 'CUSTOMER',
        firstName: 'A',
        lastName: 'B',
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await service.login({
        email: 'a@b.com',
        password,
      } as any);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('fake.access.token');
      expect(result).toHaveProperty('refresh_token');
      expect(typeof result.refresh_token).toBe('string');
      expect(result.refresh_token.length).toBeGreaterThanOrEqual(40);

      // JWT must be signed with the user's identity fields
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'u1',
          email: 'a@b.com',
          role: 'CUSTOMER',
        }),
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
    });

    it('throws Unauthorized on wrong password (preventing user enumeration)', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass', 10);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash,
        role: 'CUSTOMER',
      });

      await expect(
        service.login({
          email: 'a@b.com',
          password: 'WRONG',
        } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // Must NOT issue tokens for failed login
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('throws Unauthorized on missing user (same error as wrong password — no enumeration)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nobody@example.com',
          password: 'whatever',
        } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refreshAccessToken()', () => {
    it('rotates the refresh token on use (one-time-use semantics)', async () => {
      // The user's current refresh token (hashed in DB)
      const plaintextToken = 'abc123def456';
      const tokenHash = await bcrypt.hash(plaintextToken, 10);

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'rt1',
          userId: 'u1',
          tokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          revokedAt: null,
          user: {
            id: 'u1',
            email: 'a@b.com',
            role: 'CUSTOMER',
            firstName: 'A',
            lastName: 'B',
          },
        },
      ]);
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await service.refreshAccessToken(plaintextToken);

      // The presented refresh token is now revoked (cannot be reused)
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );

      // A new refresh token is issued
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.refresh_token).not.toBe(plaintextToken);
      expect(result).toHaveProperty('access_token');
    });

    it('rejects an unknown refresh token with 401', async () => {
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.refreshAccessToken('not-a-real-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
