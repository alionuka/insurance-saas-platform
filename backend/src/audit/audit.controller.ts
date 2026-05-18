import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Audit')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('me')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'List audit logs relating to the current active user',
  })
  @ApiResponse({ status: 200, description: 'Audit logs listed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  async getMe(
    @CurrentUser() user: AuthUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.auditService.listForUser(user.id, {
      limit: pagination.limit ?? 10,
      offset: pagination.offset ?? 0,
    });
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary:
      'List platform audit logs with custom filters (platform admin only)',
  })
  @ApiResponse({ status: 200, description: 'Audit logs listed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
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
