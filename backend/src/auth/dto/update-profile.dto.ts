import {
  IsString,
  Length,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Alice',
    description: 'User first name',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Smith',
    description: 'User last name',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Age of the user',
    minimum: 18,
    maximum: 100,
  })
  @IsInt()
  @Min(18)
  @Max(100)
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({
    example: 75000,
    description: 'Annual income of the customer',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualIncome?: number;

  @ApiPropertyOptional({
    example: 720,
    description: 'Credit score of the customer',
    minimum: 300,
    maximum: 850,
  })
  @IsInt()
  @Min(300)
  @Max(850)
  @IsOptional()
  creditScore?: number;
}
