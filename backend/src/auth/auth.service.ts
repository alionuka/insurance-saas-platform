import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@prisma/client';

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
      actor: { id: user.id, email: user.email, role: user.role as UserRole },
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

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

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
      actor: { id: user.id, email: user.email, role: user.role as UserRole },
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
      actor: { id: user.id, email: user.email, role: user.role as UserRole },
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
      actor: { id: resetToken.userId, email: resetToken.user.email, role: resetToken.user.role as UserRole },
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

    const { passwordHash, ...result } = user;
    return result;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
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
      actor: { id: user.id, email: user.email, role: user.role as UserRole },
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

    const dataToUpdate: any = {};
    const changedFields: string[] = [];

    for (const key of allowedKeys) {
      if (dto[key] !== undefined) {
        if (dto[key] !== user[key]) {
          dataToUpdate[key] = dto[key];
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
        actor: { id: user.id, email: user.email, role: user.role as UserRole },
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
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + refreshTokenTtl) }
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
    let matchedToken: any = null;
    for (const tokenRecord of tokensInDb) {
      const isMatch = await bcrypt.compare(refresh_token, tokenRecord.tokenHash);
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
}
