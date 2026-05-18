import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/ml-models')
@Roles(UserRole.PLATFORM_ADMIN)
export class MlModelsController {
  @Get()
  @ApiOperation({
    summary:
      'Get ML model training metrics and plot configurations (platform admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'ML models metadata retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
  async getMlModels() {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    const fetchMetrics = async (
      type: string,
    ): Promise<Record<string, any> | null> => {
      try {
        const response = await fetch(`${mlServiceUrl}/metrics/${type}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          return (await response.json()) as Record<string, any>;
        }
        return null;
      } catch (err) {
        // Log locally, but return null so the dashboard doesn't crash if one model is missing
        console.error(`Failed to fetch ML metrics for ${type}:`, err);
        return null;
      }
    };

    const [risk, fraud, recommendations] = await Promise.all([
      fetchMetrics('risk'),
      fetchMetrics('fraud'),
      fetchMetrics('recommendations'),
    ]);

    return {
      risk,
      fraud,
      recommendations,
      plotsBaseUrl: `${mlServiceUrl}/plots`,
    };
  }
}
