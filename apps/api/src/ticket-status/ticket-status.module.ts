import { Module } from '@nestjs/common';
import { TicketStatusController } from './ticket-status.controller.js';
import { TicketStatusService } from './ticket-status.service.js';

@Module({
  controllers: [TicketStatusController],
  providers: [TicketStatusService],
  exports: [TicketStatusService],
})
export class TicketStatusModule {}