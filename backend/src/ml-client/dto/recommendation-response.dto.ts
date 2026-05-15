export interface RankedRecommendedProduct {
  productId: string;
  name: string;
  type: string;
  similarity: number;
}

export class RecommendationResponseDto {
  recommendedProducts: string[];
  rankedProducts: RankedRecommendedProduct[];
  explanation: string;
}
