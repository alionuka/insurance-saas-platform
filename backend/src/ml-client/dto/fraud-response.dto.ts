export class FraudResponseDto {
  fraudScore: number;
  flag: 'NORMAL' | 'SUSPICIOUS';
  explanation: string;
}
