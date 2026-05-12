import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { MlClientModule } from '../ml-client/ml-client.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [MlClientModule, EmailModule],
  controllers: [ClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule {}
