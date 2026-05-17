export class RiskResponseDto {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  featureContributions?: Array<{
    feature: string;
    value: number | string;
    contribution: number;
  }>;
}
