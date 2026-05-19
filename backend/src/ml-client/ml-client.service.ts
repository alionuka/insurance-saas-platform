import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RiskPredictDto } from './dto/risk.dto';
import { FraudDetectDto } from './dto/fraud.dto';
import { RecommendationsDto } from './dto/recommendation.dto';
import { RiskResponseDto } from './dto/risk-response.dto';
import { FraudResponseDto } from './dto/fraud-response.dto';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';

@Injectable()
export class MlClientService {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    // Shared secret with ml-service. When unset (local dev) no auth header
    // is sent; ml-service also disables auth when its own env var is unset.
    this.apiKey = process.env.ML_INTERNAL_API_KEY;
  }

  /** Build headers for an internal ML request — adds API key when configured. */
  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      h['X-Internal-API-Key'] = this.apiKey;
    }
    return h;
  }

  async getHealth(): Promise<Record<string, any>> {
    try {
      // /health is intentionally public — no API key needed
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) throw new Error('ML Service health check failed');
      return (await response.json()) as Record<string, any>;
    } catch {
      throw new HttpException(
        'ML Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async predictRisk(data: RiskPredictDto): Promise<RiskResponseDto> {
    try {
      const response = await fetch(`${this.baseUrl}/risk/predict`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to predict risk');
      return (await response.json()) as RiskResponseDto;
    } catch {
      throw new HttpException(
        'Error communicating with ML Service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async detectFraud(data: FraudDetectDto): Promise<FraudResponseDto> {
    try {
      const response = await fetch(`${this.baseUrl}/fraud/detect`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to detect fraud');
      return (await response.json()) as FraudResponseDto;
    } catch {
      throw new HttpException(
        'Error communicating with ML Service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRecommendations(
    data: RecommendationsDto,
  ): Promise<RecommendationResponseDto> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to get recommendations');
      return (await response.json()) as RecommendationResponseDto;
    } catch {
      throw new HttpException(
        'Error communicating with ML Service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
