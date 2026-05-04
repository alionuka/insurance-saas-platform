import { Controller, Get, Post, Body } from '@nestjs/common';
import { MlClientService } from './ml-client.service';
import { RiskPredictDto } from './dto/risk.dto';
import { FraudDetectDto } from './dto/fraud.dto';
import { RecommendationsDto } from './dto/recommendation.dto';

@Controller('ml')
export class MlClientController {
  constructor(private readonly mlClientService: MlClientService) {}

  @Get('health')
  getHealth() {
    return this.mlClientService.getHealth();
  }

  @Post('risk/predict')
  predictRisk(@Body() data: RiskPredictDto) {
    return this.mlClientService.predictRisk(data);
  }

  @Post('fraud/detect')
  detectFraud(@Body() data: FraudDetectDto) {
    return this.mlClientService.detectFraud(data);
  }

  @Post('recommendations')
  getRecommendations(@Body() data: RecommendationsDto) {
    return this.mlClientService.getRecommendations(data);
  }
}
