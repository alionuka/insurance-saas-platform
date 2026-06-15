import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RiskPredictDto } from './dto/risk.dto';
import { FraudDetectDto } from './dto/fraud.dto';
import { RecommendationsDto } from './dto/recommendation.dto';
import { RiskResponseDto } from './dto/risk-response.dto';
import { FraudResponseDto } from './dto/fraud-response.dto';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';

/**
 * Default ML request budget. Railway free-tier ML containers may take
 * ~10-30 s to cold-start, but once warm a real inference is < 500 ms.
 * 20 s gives the cold start a chance without blocking the UI forever:
 * if it takes longer than that, surfacing a clear retry message is
 * better UX than spinning indefinitely.
 */
const ML_TIMEOUT_MS = 20_000;

@Injectable()
export class MlClientService {
  private readonly logger = new Logger(MlClientService.name);
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

  /**
   * Run an ML request with a hard timeout via AbortController and translate
   * failure modes into actionable HTTP errors. We surface the cold-start
   * case explicitly (503 + a hint) so the frontend can render a "retry in
   * a moment" toast instead of a generic 500. Errors are logged so we can
   * tell in Railway logs whether the failure was timeout vs. 5xx vs. parse.
   */
  private async callMl<T>(
    op: string,
    url: string,
    init: RequestInit & { skipApiKey?: boolean } = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
    const { skipApiKey, ...fetchInit } = init;
    try {
      const response = await fetch(url, {
        ...fetchInit,
        headers: skipApiKey ? fetchInit.headers : this.headers(),
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.warn(
          `ML ${op} returned HTTP ${response.status} (${response.statusText})`,
        );
        throw new HttpException(
          `ML Service error (HTTP ${response.status})`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      return (await response.json()) as T;
    } catch (err) {
      // Re-throw HttpException as-is so the controller-mapped status survives.
      if (err instanceof HttpException) throw err;

      // AbortError = our timeout fired. Treat as a transient 503 with a
      // clear hint so the client can retry — typically a cold start.
      if (err instanceof Error && err.name === 'AbortError') {
        this.logger.warn(`ML ${op} aborted after ${ML_TIMEOUT_MS}ms`);
        throw new HttpException(
          'ML Service warming up — please retry in a moment',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Network-level failure (DNS, connection refused) — service is down.
      this.logger.error(
        `ML ${op} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new HttpException(
        'ML Service unreachable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async getHealth(): Promise<Record<string, any>> {
    return this.callMl<Record<string, any>>(
      'health',
      `${this.baseUrl}/health`,
      { skipApiKey: true },
    );
  }

  async predictRisk(data: RiskPredictDto): Promise<RiskResponseDto> {
    return this.callMl<RiskResponseDto>(
      'predictRisk',
      `${this.baseUrl}/risk/predict`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  }

  async detectFraud(data: FraudDetectDto): Promise<FraudResponseDto> {
    return this.callMl<FraudResponseDto>(
      'detectFraud',
      `${this.baseUrl}/fraud/detect`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  }

  async getRecommendations(
    data: RecommendationsDto,
  ): Promise<RecommendationResponseDto> {
    return this.callMl<RecommendationResponseDto>(
      'getRecommendations',
      `${this.baseUrl}/recommendations`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  }
}
