import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RiskPredictDto } from './dto/risk.dto';
import { FraudDetectDto } from './dto/fraud.dto';
import { RecommendationsDto } from './dto/recommendation.dto';

@Injectable()
export class MlClientService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  async getHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) throw new Error('ML Service health check failed');
      return await response.json();
    } catch (error) {
      throw new HttpException('ML Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async predictRisk(data: RiskPredictDto) {
    try {
      const response = await fetch(`${this.baseUrl}/risk/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to predict risk');
      return await response.json();
    } catch (error) {
      throw new HttpException('Error communicating with ML Service', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async detectFraud(data: FraudDetectDto) {
    try {
      const response = await fetch(`${this.baseUrl}/fraud/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to detect fraud');
      return await response.json();
    } catch (error) {
      throw new HttpException('Error communicating with ML Service', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRecommendations(data: RecommendationsDto) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to get recommendations');
      return await response.json();
    } catch (error) {
      throw new HttpException('Error communicating with ML Service', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
