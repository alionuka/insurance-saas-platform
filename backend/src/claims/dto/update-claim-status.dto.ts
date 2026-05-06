import { ClaimStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateClaimStatusDto {
  @IsNotEmpty()
  @IsEnum(ClaimStatus)
  status: ClaimStatus;
}
