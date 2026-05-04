import { Module } from '@nestjs/common';
import { MlClientService } from './ml-client.service';
import { MlClientController } from './ml-client.controller';

@Module({
  providers: [MlClientService],
  controllers: [MlClientController],
  exports: [MlClientService],
})
export class MlClientModule {}
