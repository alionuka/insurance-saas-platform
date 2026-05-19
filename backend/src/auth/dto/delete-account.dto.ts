import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * GDPR account-deletion confirmation. The user must re-supply their current
 * password to authorise the destructive operation.
 */
export class DeleteAccountDto {
  @ApiProperty({
    example: 'CurrentPassword123!',
    description: 'Current password — required to confirm account deletion',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
