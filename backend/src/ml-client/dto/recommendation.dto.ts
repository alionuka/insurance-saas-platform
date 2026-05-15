export class RecommendationsDto {
  clientId: string;
  age: number;
  lifeEvents: string[];
  annualIncome?: number;
  topK?: number;
}
