import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import type { ThreadEventResponse } from '@helpdesk/contract';
import { PermissionGuard } from '../auth/permission.guard.js';
import { ThreadEventService } from './thread-event.service.js';

// Tidak ada POST — ThreadEvent murni otomatis dari TicketService, bukan
// ditulis manual lewat endpoint (spec §8.3).
@Controller('tickets/:ticketId/thread-events')
@UseGuards(PermissionGuard)
export class ThreadEventController {
  constructor(private readonly events: ThreadEventService) {}

  @Get()
  list(@Param('ticketId', ParseIntPipe) ticketId: number): Promise<ThreadEventResponse[]> {
    return this.events.list(ticketId);
  }
}