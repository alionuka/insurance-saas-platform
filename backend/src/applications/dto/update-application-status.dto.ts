import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsNotEmpty()
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
