import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Self-service company-admin branding updates. A COMPANY_ADMIN can edit
 * their own tenant's display name, description, and visual identity
 * (logo URL is set via the file-upload endpoint, not here).
 *
 * PLATFORM_ADMIN can use the same DTO via the /companies/:id endpoint
 * to fix tenant data for support purposes.
 */
export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Acme Insurance Group' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Specialty motor + health insurance, serving EU since 2015.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: '#6366f1',
    description: 'CSS hex color used to brand customer-facing surfaces',
  })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;
}
