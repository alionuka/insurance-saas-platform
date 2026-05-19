import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Self-service company onboarding. Creates a new tenant (Company) together
 * with its first COMPANY_ADMIN account in a single atomic transaction.
 *
 * KYC/business-verification flow (proof of registration, license number,
 * banking details) is deliberately out of scope for this thesis project —
 * a production deployment would gate this endpoint behind that approval
 * step before activating the tenant.
 */
export class RegisterCompanyDto {
  @ApiProperty({
    example: 'Acme Insurance Co.',
    description: 'Legal name of the insurance company to onboard',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName!: string;

  @ApiProperty({
    example: 'admin@acme-insurance.com',
    description: 'Email for the primary administrator account',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Strong-Password-1',
    description: 'Password for the administrator account (min 8 chars)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Jane', description: "Administrator's first name" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: "Administrator's last name" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  // KYC indicators — stored against the Company row but not externally
  // validated in this thesis project. See COMPLIANCE.md → "KYC Scope".
  @ApiPropertyOptional({
    example: 'IL-2024-INS-12345',
    description:
      'National insurance licence number — captured for KYC, not validated externally in this scope',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string;

  @ApiPropertyOptional({
    example: 'UA',
    description: 'ISO-3166 country code of operation (2 letters)',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({
    example: '+380 44 555 0000',
    description: 'Compliance contact phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}
