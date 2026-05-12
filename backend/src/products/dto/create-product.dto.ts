import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';
import { ProductType } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ProductType)
  @IsNotEmpty()
  type: ProductType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  basePremium: number;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
