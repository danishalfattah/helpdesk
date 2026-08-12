import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import {
  AssignTicketRequest,
  CreateTicketRequest,
  UpdateTicketRequest,
  type CreateTicketResponse,
  type TicketDto,
  type UpdateTicketResponse,
} from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { TicketService } from './ticket.service.js';
import { CurrentAgent } from '../auth/current-agent.decorator.js';

// Route baca terbuka untuk semua agent yang login, sama seperti Department/Category
// — daftar/detail tiket dipakai luas, bukan cuma yang berwenang mengelola.
@Controller('tickets')
@UseGuards(PermissionGuard)
export class TicketController {
  constructor(private readonly tickets: TicketService) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ ticket: TicketDto }> {
    return { ticket: await this.tickets.findOne(id) };
  }

  @Post()
  @RequirePermission('ticket.create')
  @UsePipes(new ZodValidationPipe(CreateTicketRequest))
  async create(@Body() body: CreateTicketRequest): Promise<CreateTicketResponse> {
    return { ticket: await this.tickets.create(body) };
  }

  @Patch(':id')
  @RequirePermission('ticket.edit')
  @UsePipes(new ZodValidationPipe(UpdateTicketRequest))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAgent() agent: { id: number },
    @Body() body: UpdateTicketRequest,
  ): Promise<UpdateTicketResponse> {
    return { ticket: await this.tickets.update(id, agent.id, body) };
  }

  @Post(':id/reopen')
  @RequirePermission('ticket.edit')
  async reopen(@Param('id', ParseIntPipe) id: number, @CurrentAgent() agent: { id: number }): Promise<UpdateTicketResponse> {
    return { ticket: await this.tickets.reopen(id, agent.id) };
  }

  @Post(':id/assign')
  @RequirePermission('ticket.edit')
  @UsePipes(new ZodValidationPipe(AssignTicketRequest))
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAgent() agent: { id: number },
    @Body() body: AssignTicketRequest,
  ): Promise<UpdateTicketResponse> {
    return { ticket: await this.tickets.assign(id, agent.id, body.agentId) };
  }
}
