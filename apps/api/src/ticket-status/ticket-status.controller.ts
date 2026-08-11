import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import { CreateTicketStatusRequest, UpdateTicketStatusRequest, type TicketStatusResponse } from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { TicketStatusService } from './ticket-status.service.js';

@Controller('ticket-statuses')
@UseGuards(PermissionGuard)
export class TicketStatusController {
  constructor(private readonly statuses: TicketStatusService) {}

  @Post()
  @RequirePermission('ticket-status.manage')
  @UsePipes(new ZodValidationPipe(CreateTicketStatusRequest))
  create(@Body() body: CreateTicketStatusRequest): Promise<TicketStatusResponse> {
    return this.statuses.create(body);
  }

  @Get()
  @RequirePermission('ticket-status.manage')
  list(): Promise<TicketStatusResponse[]> {
    return this.statuses.list();
  }

  @Patch(':id')
  @RequirePermission('ticket-status.manage')
  @UsePipes(new ZodValidationPipe(UpdateTicketStatusRequest))
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateTicketStatusRequest): Promise<TicketStatusResponse> {
    return this.statuses.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('ticket-status.manage')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.statuses.remove(id);
  }
}