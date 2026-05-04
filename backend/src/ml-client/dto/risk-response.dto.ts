export class RiskResponseDto {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}
