import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';
import { PaginationDto } from '../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('me')
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  async getMe(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.auditService.listForUser(user.id, {
      limit: pagination.limit ?? 10,
      offset: pagination.offset ?? 0,
    });
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN)
  async list(@Query() dto: ListAuditLogsDto) {
    return this.auditService.list({
      action: dto.action,
      actorId: dto.actorId,
      resourceType: dto.resourceType,
      from: dto.from ? new Date(dto.from) : undefined,
      to: dto.to ? new Date(dto.to) : undefined,
      limit: dto.limit ?? 50,
      offset: dto.offset ?? 0,
    });
  }
}
