import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  CreateAgentRequest,
  UpdateAgentRequest,
  AssignAgentRoleRequest,
  type AgentDto,
  type CreateAgentResponse,
  type ListAgentsResponse,
  type UpdateAgentResponse,
} from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { AgentService } from './agent.service.js';

// Sama seperti DepartmentController: route baca terbuka untuk semua agent yang
// login (dipakai dropdown assignee tiket nanti), route ubah butuh agent.manage.
@Controller('agents')
@UseGuards(PermissionGuard)
export class AgentController {
  constructor(private readonly agents: AgentService) {}

  @Get()
  async list(): Promise<ListAgentsResponse> {
    return { agents: await this.agents.list() };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ agent: AgentDto }> {
    return { agent: await this.agents.findOne(id) };
  }

  @Post()
  @RequirePermission('agent.manage')
  @UsePipes(new ZodValidationPipe(CreateAgentRequest))
  async create(@Body() body: CreateAgentRequest): Promise<CreateAgentResponse> {
    return { agent: await this.agents.create(body) };
  }

  @Patch(':id')
  @RequirePermission('agent.manage')
  @UsePipes(new ZodValidationPipe(UpdateAgentRequest))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentRequest,
  ): Promise<UpdateAgentResponse> {
    return { agent: await this.agents.update(id, body) };
  }

  @Post(':id/roles')
  @RequirePermission('agent.manage')
  @UsePipes(new ZodValidationPipe(AssignAgentRoleRequest))
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssignAgentRoleRequest,
  ): Promise<{ ok: true }> {
    await this.agents.assignRole(id, body.roleId);
    return { ok: true };
  }

  @Delete(':id/roles/:roleId')
  @RequirePermission('agent.manage')
  async removeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<{ ok: true }> {
    await this.agents.removeRole(id, roleId);
    return { ok: true };
  }
}
