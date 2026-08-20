import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { Message } from './entities/message.entity';
import { Deal } from '../deals/entities/deal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Deal])],
  providers: [MessagesService, MessagesGateway],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
