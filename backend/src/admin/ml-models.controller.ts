import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';
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
      // Plots are proxied through this backend (see GET /admin/ml-models/plots/:filename).
      // The backend fetches them from the ml-service over Railway's internal network and
      // streams them to the browser, so we never expose the ml-service publicly.
      plotsBaseUrl: '/admin/ml-models/plots',
    };
  }

  @Get('plots/:filename')
  @ApiOperation({
    summary:
      'Proxy a training plot PNG from the ml-service (platform admin only)',
  })
  @ApiParam({
    name: 'filename',
    description:
      'PNG plot filename, e.g. risk_roc_curves.png, fraud_confusion_matrix.png',
  })
  @ApiResponse({ status: 200, description: 'PNG image streamed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
  @ApiResponse({ status: 404, description: 'Plot not found' })
  async getPlot(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    // Defensive: only allow simple lowercase PNG filenames — no path traversal.
    if (!/^[a-z0-9_]+\.png$/i.test(filename)) {
      throw new NotFoundException('Invalid plot filename');
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    try {
      const upstream = await fetch(`${mlServiceUrl}/plots/${filename}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!upstream.ok || !upstream.body) {
        throw new NotFoundException('Plot not found');
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error(`Failed to proxy plot ${filename}:`, err);
      throw new NotFoundException('Plot not available');
    }
  }
}
