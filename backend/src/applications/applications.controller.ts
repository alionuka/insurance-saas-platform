import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.applicationsService.findAll(user, {
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@Body() createApplicationDto: CreateApplicationDto, @CurrentUser() user: AuthUser) {
    return this.applicationsService.create(createApplicationDto, user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateApplicationStatusDto: UpdateApplicationStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.updateStatus(id, updateApplicationStatusDto.status, user);
  }
}
