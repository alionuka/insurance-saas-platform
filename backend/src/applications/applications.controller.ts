import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';

@ApiTags('Applications')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all insurance applications' })
  @ApiResponse({ status: 200, description: 'Applications listed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.applicationsService.findAll(user, {
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get application details' })
  @ApiResponse({ status: 200, description: 'Application details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new insurance application' })
  @ApiResponse({ status: 201, description: 'Application successfully created' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer role only' })
  create(@Body() createApplicationDto: CreateApplicationDto, @CurrentUser() user: AuthUser) {
    return this.applicationsService.create(createApplicationDto, user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update insurance application status' })
  @ApiResponse({ status: 200, description: 'Application status successfully updated' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin/agent/company admin roles only' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateApplicationStatusDto: UpdateApplicationStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.updateStatus(id, updateApplicationStatusDto.status, user);
  }
}
