import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alice@example.com', description: 'Email address registered with account' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
