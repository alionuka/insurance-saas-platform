import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  async findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.policiesService.findAll(user, {
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.policiesService.findOne(id, user);
  }
}
