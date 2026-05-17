import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';
import { UserRole } from '@prisma/client';

@ApiTags('Recommendations')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get personalized product recommendations for active customer' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  getMyRecommendations(@CurrentUser() user: AuthUser) {
    return this.recommendationsService.getForCustomer(user);
  }
}
