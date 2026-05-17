import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateClaimDto {
  @ApiPropertyOptional({ example: 'app-uuid-123456', description: 'Application ID, if claim is initiated from application view' })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional({ example: 'policy-uuid-123456', description: 'Policy ID against which the claim is being filed' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  policyId?: string;

  @ApiProperty({ example: 250.00, description: 'Claim payout amount requested' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'Windshield cracked due to small rock on highway.', description: 'Detailed claim description explaining the incident' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
