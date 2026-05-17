import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MlClientService } from './ml-client.service';
import { RiskPredictDto } from './dto/risk.dto';
import { FraudDetectDto } from './dto/fraud.dto';
import { RecommendationsDto } from './dto/recommendation.dto';
import { RiskResponseDto } from './dto/risk-response.dto';
import { FraudResponseDto } from './dto/fraud-response.dto';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';

@ApiTags('ML')
@Controller('ml')
export class MlClientController {
  constructor(private readonly mlClientService: MlClientService) {}

  @Get('health')
  @ApiOperation({ summary: 'ML Service health check' })
  @ApiResponse({ status: 200, description: 'ML service health status retrieved successfully' })
  getHealth() {
    return this.mlClientService.getHealth();
  }

  @Post('risk/predict')
  @ApiOperation({ summary: 'ML Direct risk prediction' })
  @ApiResponse({ status: 201, description: 'Direct risk assessment calculated successfully' })
  predictRisk(@Body() data: RiskPredictDto): Promise<RiskResponseDto> {
    return this.mlClientService.predictRisk(data);
  }

  @Post('fraud/detect')
  @ApiOperation({ summary: 'ML Direct fraud detection' })
  @ApiResponse({ status: 201, description: 'Direct fraud detection calculated successfully' })
  detectFraud(@Body() data: FraudDetectDto): Promise<FraudResponseDto> {
    return this.mlClientService.detectFraud(data);
  }

  @Post('recommendations')
  @ApiOperation({ summary: 'ML Direct product recommendation' })
  @ApiResponse({ status: 201, description: 'Direct recommendations calculated successfully' })
  getRecommendations(@Body() data: RecommendationsDto): Promise<RecommendationResponseDto> {
    return this.mlClientService.getRecommendations(data);
  }
}
