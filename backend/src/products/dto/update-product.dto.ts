import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Comprehensive Auto Coverage',
    description: 'Name of the insurance product',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    enum: ProductType,
    description: 'Type of the product',
  })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiPropertyOptional({
    example:
      'Full coverage auto insurance policy covering liability, comprehensive, and collision.',
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 120.0,
    description: 'Base premium amount per month',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePremium?: number;
}
