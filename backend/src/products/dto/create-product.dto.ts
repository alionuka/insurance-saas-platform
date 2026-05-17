import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Comprehensive Auto Coverage', description: 'Name of the insurance product' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ProductType, description: 'Type of the product' })
  @IsEnum(ProductType)
  @IsNotEmpty()
  type: ProductType;

  @ApiPropertyOptional({ example: 'Full coverage auto insurance policy covering liability, comprehensive, and collision.', description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 120.00, description: 'Base premium amount per month' })
  @IsNumber()
  @Min(0)
  basePremium: number;

  @ApiPropertyOptional({ example: 'company-uuid-123456', description: 'ID of company the product belongs to (Platform Admin only can set)' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
