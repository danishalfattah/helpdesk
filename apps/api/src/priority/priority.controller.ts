import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import { CreatePriorityRequest, UpdatePriorityRequest, type PriorityResponse } from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { PriorityService } from './priority.service.js';

@Controller('priorities')
@UseGuards(PermissionGuard)
export class PriorityController {
  constructor(private readonly priorities: PriorityService) {}

  @Post()
  @RequirePermission('priority.manage')
  @UsePipes(new ZodValidationPipe(CreatePriorityRequest))
  create(@Body() body: CreatePriorityRequest): Promise<PriorityResponse> {
    return this.priorities.create(body);
  }

  @Get()
  @RequirePermission('priority.manage')
  list(): Promise<PriorityResponse[]> {
    return this.priorities.list();
  }

  @Patch(':id')
  @RequirePermission('priority.manage')
  @UsePipes(new ZodValidationPipe(UpdatePriorityRequest))
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePriorityRequest): Promise<PriorityResponse> {
    return this.priorities.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('priority.manage')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.priorities.remove(id);
  }
}