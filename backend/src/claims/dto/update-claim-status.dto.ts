import { ClaimStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClaimStatusDto {
  @ApiProperty({ enum: ClaimStatus, description: 'New status for the claim' })
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  status: ClaimStatus;
}
