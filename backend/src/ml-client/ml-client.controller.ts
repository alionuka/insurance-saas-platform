import { Controller, Get, Post, Body } from '@nestjs/common';
import { MlClientService } from './ml-client.service';
import { RiskPredictDto } from './dto/risk.dto';
import { FraudDetectDto } from './dto/fraud.dto';
import { RecommendationsDto } from './dto/recommendation.dto';
import { RiskResponseDto } from './dto/risk-response.dto';
import { FraudResponseDto } from './dto/fraud-response.dto';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';

@Controller('ml')
export class MlClientController {
  constructor(private readonly mlClientService: MlClientService) {}

  @Get('health')
  getHealth() {
    return this.mlClientService.getHealth();
  }

  @Post('risk/predict')
  predictRisk(@Body() data: RiskPredictDto): Promise<RiskResponseDto> {
    return this.mlClientService.predictRisk(data);
  }

  @Post('fraud/detect')
  detectFraud(@Body() data: FraudDetectDto): Promise<FraudResponseDto> {
    return this.mlClientService.detectFraud(data);
  }

  @Post('recommendations')
  getRecommendations(@Body() data: RecommendationsDto): Promise<RecommendationResponseDto> {
    return this.mlClientService.getRecommendations(data);
  }
}
