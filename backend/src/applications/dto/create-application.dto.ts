import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    example: 'prod-uuid-123456',
    description: 'ID of the product being applied for',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;
}
