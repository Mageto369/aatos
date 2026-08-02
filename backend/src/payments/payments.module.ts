import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';
import { FlutterwaveService } from './flutterwave.service';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, FlutterwaveService],
  exports: [PaymentsService, FlutterwaveService],
})
export class PaymentsModule {}
