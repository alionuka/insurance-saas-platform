export class FraudResponseDto {
  fraudScore: number;
  flag: 'NORMAL' | 'SUSPICIOUS';
  explanation: string;
  featureContributions?: Array<{
    feature: string;
    value: number | string;
    contribution: number;
  }>;
}
