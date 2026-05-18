import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';
import { UserRole } from '@prisma/client';

@ApiTags('Policies')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @Roles(
    UserRole.CUSTOMER,
    UserRole.AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({ summary: 'List all policies' })
  @ApiResponse({ status: 200, description: 'Policies listed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.policiesService.findAll(user, {
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get(':id')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({ summary: 'Get policy details' })
  @ApiResponse({
    status: 200,
    description: 'Policy details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.policiesService.findOne(id, user);
  }
}
