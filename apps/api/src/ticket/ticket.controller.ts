import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, UsePipes } from '@nestjs/common';
import { CreateTicketRequest, type CreateTicketResponse, type TicketDto } from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { TicketService } from './ticket.service.js';

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
}
