import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { MlClientModule } from '../ml-client/ml-client.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [MlClientModule, EmailModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
