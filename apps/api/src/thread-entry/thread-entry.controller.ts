import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, UsePipes } from '@nestjs/common';
import { CreateThreadEntryRequest, type ThreadEntryResponse } from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentAgent } from '../auth/current-agent.decorator.js';
import { ThreadEntryService } from './thread-entry.service.js';

// Nested di bawah /tickets/:id, sama seperti pola /tickets/:id/reopen milik Bagas.
@Controller('tickets/:ticketId/thread-entries')
@UseGuards(PermissionGuard)
export class ThreadEntryController {
  constructor(private readonly entries: ThreadEntryService) {}

  @Get()
  list(@Param('ticketId', ParseIntPipe) ticketId: number): Promise<ThreadEntryResponse[]> {
    return this.entries.list(ticketId);
  }

  @Post()
  @RequirePermission('ticket.edit')
  @UsePipes(new ZodValidationPipe(CreateThreadEntryRequest))
  create(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @CurrentAgent() agent: { id: number },
    @Body() body: CreateThreadEntryRequest,
  ): Promise<ThreadEntryResponse> {
    return this.entries.create(ticketId, agent.id, body);
  }
}