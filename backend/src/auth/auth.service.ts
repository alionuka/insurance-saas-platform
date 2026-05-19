import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'CUSTOMER',
        age: dto.age,
      },
    });

    await this.auditService.record({
      action: 'USER_REGISTERED',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'User',
      resourceId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    const tokens = await this.issueTokens(user);
    const { passwordHash: _, ...result } = user;
    return {
      ...tokens,
      ...result,
      user: result,
    };
  }

  /**
   * Self-service tenant onboarding. Atomically creates a Company together
   * with its first COMPANY_ADMIN user.
   *
   * The Company is created with `status = PENDING_VERIFICATION` — meaning
   * the admin can sign in and see a "your account is being reviewed" state,
   * but cannot create products / approve applications until a
   * PLATFORM_ADMIN flips status to ACTIVE via `POST /companies/:id/approve`.
   *
   * Real KYC (license validation, AML screening, business registration
   * verification) is out of scope for this thesis project — see
   * COMPLIANCE.md. The optional `licenseNumber`, `country` and
   * `contactPhone` fields are captured at signup for inclusion in the
   * compliance check, but not externally validated here.
   */
  async registerCompany(dto: RegisterCompanyDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingCompany = await this.prisma.company.findFirst({
      where: { name: dto.companyName },
    });
    if (existingCompany) {
      throw new ConflictException(
        `Company "${dto.companyName}" is already registered`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Single atomic transaction so we never end up with an orphaned Company
    // (no admin) or orphaned admin (no company).
    const { company, user } = await this.prisma.$transaction(
      async (tx) => {
        const company = await tx.company.create({
          data: {
            name: dto.companyName,
            status: 'PENDING_VERIFICATION',
            licenseNumber: dto.licenseNumber,
            country: dto.country,
            contactPhone: dto.contactPhone,
          },
        });
        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'COMPANY_ADMIN',
            companyId: company.id,
          },
        });
        return { company, user };
      },
      { timeout: 15_000 },
    );

    await this.auditService.record({
      action: 'COMPANY_REGISTERED',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'Company',
      resourceId: company.id,
      metadata: {
        companyName: company.name,
        adminEmail: user.email,
        licenseNumber: dto.licenseNumber ?? null,
        country: dto.country ?? null,
      },
    });

    // No auto-login here: the company is PENDING_VERIFICATION, so we want
    // the user to land on a "pending review" page rather than the
    // dashboard. They sign in normally once the platform admin approves.
    return {
      success: true,
      status: 'PENDING_VERIFICATION' as const,
      company: {
        id: company.id,
        name: company.name,
      },
      message:
        'Company registered. A platform admin will review your application and notify you when access is granted.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      await this.auditService.record({
        action: 'USER_LOGIN_FAILED',
        actor: null,
        resourceType: 'User',
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.auditService.record({
        action: 'USER_LOGIN_FAILED',
        actor: null,
        resourceType: 'User',
        resourceId: user.id,
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.record({
      action: 'USER_LOGIN_SUCCESS',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'User',
      resourceId: user.id,
    });

    const tokens = await this.issueTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Prevents account enumeration
      return;
    }

    // Invalidate existing tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await this.auditService.record({
      action: 'PASSWORD_RESET_REQUESTED',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'User',
      resourceId: user.id,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      // Swallowing the error here so the API always returns 200 to the client
      console.error('Failed to send password reset email', error);
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    await this.auditService.record({
      action: 'PASSWORD_RESET_COMPLETED',
      actor: {
        id: resetToken.userId,
        email: resetToken.user.email,
        role: resetToken.user.role,
      },
      resourceType: 'User',
      resourceId: resetToken.userId,
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const { passwordHash: _passwordHash, ...result } = user;
    return result;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await this.auditService.record({
      action: 'PASSWORD_CHANGED',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'User',
      resourceId: user.id,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const allowedKeys: (keyof UpdateProfileDto)[] = [
      'firstName',
      'lastName',
      'age',
      'annualIncome',
      'creditScore',
    ];

    const dataToUpdate: Prisma.UserUpdateInput = {};
    const changedFields: string[] = [];

    for (const key of allowedKeys) {
      if (dto[key] !== undefined) {
        if (dto[key] !== user[key]) {
          const val = dto[key];
          if (key === 'firstName' || key === 'lastName') {
            dataToUpdate[key] = val as string;
          } else if (
            key === 'age' ||
            key === 'creditScore' ||
            key === 'annualIncome'
          ) {
            dataToUpdate[key] = val as number | null;
          }
          changedFields.push(key);
        }
      }
    }

    if (changedFields.length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      await this.auditService.record({
        action: 'PROFILE_UPDATED',
        actor: { id: user.id, email: user.email, role: user.role },
        resourceType: 'User',
        resourceId: user.id,
        metadata: { changedFields },
      });
    }

    return this.getMe(userId);
  }

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const accessTokenTtl = '15m';
    const refreshTokenTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
    const access_token = this.jwtService.sign(
      { email: user.email, sub: user.id, role: user.role },
      { expiresIn: accessTokenTtl },
    );
    const refresh_token = crypto.randomBytes(40).toString('hex');
    const tokenHash = await bcrypt.hash(refresh_token, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + refreshTokenTtl),
      },
    });
    return { access_token, refresh_token };
  }

  async refreshAccessToken(refresh_token: string) {
    // Find all non-revoked, non-expired refresh tokens
    const tokensInDb = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    // Compare via bcrypt.compare against tokenHash
    let matchedToken: Prisma.RefreshTokenGetPayload<{
      include: { user: true };
    }> | null = null;
    for (const tokenRecord of tokensInDb) {
      const isMatch = await bcrypt.compare(
        refresh_token,
        tokenRecord.tokenHash,
      );
      if (isMatch) {
        matchedToken = tokenRecord;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // REVOKE the matched token (set revokedAt=now)
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue a NEW pair via issueTokens (rotation)
    const newTokens = await this.issueTokens(matchedToken.user);

    return {
      ...newTokens,
      user: {
        id: matchedToken.user.id,
        email: matchedToken.user.email,
        firstName: matchedToken.user.firstName,
        lastName: matchedToken.user.lastName,
        role: matchedToken.user.role,
      },
    };
  }

  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * GDPR — right to data portability (Article 20).
   * Returns a JSON document containing all personal data held about the user.
   * The user can save this file or supply it to another provider.
   */
  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        applications: { include: { product: true, riskAssessments: true } },
        policies: { include: { product: true, payments: true } },
        claims: { include: { fraudAssessments: true, documents: true } },
        recommendations: true,
        payments: true,
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { actorId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // Strip sensitive fields (password hash, refresh token hashes)
    const { passwordHash: _ph, ...userSafe } = user;

    await this.auditService.record({
      action: 'GDPR_DATA_EXPORTED',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'User',
      resourceId: user.id,
      metadata: { recordCount: auditLogs.length },
    });

    return {
      exportedAt: new Date().toISOString(),
      gdprArticle: 'Article 20 — Right to Data Portability',
      user: userSafe,
      auditLogs,
    };
  }

  /**
   * GDPR — right to erasure (Article 17, "right to be forgotten").
   * Permanently deletes the user account and cascades to their refresh tokens,
   * password-reset tokens, applications, claims, policies, payments.
   * Audit logs are KEPT (with actorId set to null) for legal/regulatory retention.
   */
  async deleteAccount(userId: string, providedPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    // Re-authenticate before destructive action
    const isPasswordValid = await bcrypt.compare(
      providedPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // Record the erasure BEFORE the user row is gone (otherwise actorId would be invalid)
    await this.auditService.record({
      action: 'GDPR_ACCOUNT_DELETED',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'User',
      resourceId: user.id,
      metadata: { email: user.email },
    });

    // Anonymise lingering audit logs (FK becomes null) — kept for compliance
    await this.prisma.auditLog.updateMany({
      where: { actorId: userId },
      data: { actorId: null, actorEmail: '[deleted]' },
    });

    // Cascade-delete user-owned rows. Prisma onDelete:Cascade handles refresh
    // tokens and password reset tokens automatically. Applications, claims and
    // policies are intentionally cascaded here via explicit deletes so the
    // user has full erasure of their personal data.
    //
    // 30s timeout (vs Prisma's 5s default) so long-tenured accounts with many
    // claims/policies/documents still erase atomically. If any delete fails
    // the whole transaction rolls back — never half-deleted data.
    await this.prisma.$transaction(
      async (tx) => {
        // Delete claim documents first (FK to claims)
        await tx.claimDocument.deleteMany({
          where: { claim: { userId } },
        });
        // Fraud + risk assessments cascade via their parent claim/application
        await tx.fraudAssessment.deleteMany({
          where: { claim: { userId } },
        });
        await tx.claim.deleteMany({ where: { userId } });
        await tx.riskAssessment.deleteMany({
          where: { application: { userId } },
        });
        await tx.payment.deleteMany({ where: { userId } });
        await tx.policy.deleteMany({ where: { userId } });
        await tx.application.deleteMany({ where: { userId } });
        await tx.recommendation.deleteMany({ where: { userId } });
        // Finally, the user row itself — refresh & password reset tokens cascade
        await tx.user.delete({ where: { id: userId } });
      },
      { timeout: 30_000 },
    );

    return { success: true, deletedAt: new Date().toISOString() };
  }
}
