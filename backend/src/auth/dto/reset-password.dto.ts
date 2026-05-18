import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abcdef-123456-token-xyz',
    description: 'Reset password security token received via email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Choose a new strong password, minimum 8 characters',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
