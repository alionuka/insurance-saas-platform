import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'List all users across companies (platform admin only)',
  })
  @ApiResponse({ status: 200, description: 'Users listed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
  listUsers(
    @Query('role') role?: string,
    @Query('companyId') companyId?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = Math.min(parseInt(limitStr || '50', 10) || 50, 200);
    const offset = parseInt(offsetStr || '0', 10) || 0;
    const filters: { role?: UserRole; companyId?: string } = {};
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filters.role = role as UserRole;
    }
    if (companyId) filters.companyId = companyId;
    return this.adminService.listUsers(filters, { limit, offset });
  }

  @Get('users/:id')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get user details by ID (platform admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('users')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a new user (platform admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
  createUser(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser) {
    return this.adminService.createUser(dto, actor);
  }
}
