import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';
import { FlutterwaveService } from './flutterwave.service';
import { BankTransferProvider, MobileMoneyProvider } from './bank-transfer.provider';
import { PaymentProviderRegistry } from './payment-provider.registry';
import { Payment } from './entities/payment.entity';
import { Deal } from '../deals/entities/deal.entity';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';
import { WebhookEventsService } from './webhook-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentWebhookEvent, Deal])],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, WebhookEventsService, FlutterwaveService, BankTransferProvider, MobileMoneyProvider, PaymentProviderRegistry],
  exports: [PaymentsService, WebhookEventsService, FlutterwaveService, BankTransferProvider, MobileMoneyProvider, PaymentProviderRegistry],
})
export class PaymentsModule {}
