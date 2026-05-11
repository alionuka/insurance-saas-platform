import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  findAll(@CurrentUser() user: AuthUser) {
    return this.claimsService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.claimsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@Body() createClaimDto: CreateClaimDto, @CurrentUser() user: AuthUser) {
    return this.claimsService.create(createClaimDto, user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateClaimStatusDto: UpdateClaimStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimsService.updateStatus(id, updateClaimStatusDto.status, user);
  }
}
