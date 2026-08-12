import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller.js';
import { TicketService } from './ticket.service.js';
import { ThreadEventModule } from '../thread-event/thread-event.module.js';

@Module({
  imports: [ThreadEventModule],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
