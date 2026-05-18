import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'abc123def456...', description: 'Refresh token issued at login' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
