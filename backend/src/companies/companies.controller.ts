import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN)
  findAll(@Query() pagination: PaginationDto) {
    return this.companiesService.findAll({
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN)
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
