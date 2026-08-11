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
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  type CreateDepartmentResponse,
  type DepartmentDto,
  type ListDepartmentsResponse,
  type UpdateDepartmentResponse,
} from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { DepartmentService } from './department.service.js';

// Guard dipasang di level class: semua route minimal butuh login. Route yang
// mengubah data (create/update/delete) menambahkan @RequirePermission di atasnya.
// Route baca (list/findOne) sengaja tidak diberi @RequirePermission — semua
// agent yang login boleh lihat daftar department (dipakai di form tiket nanti).
@Controller('departments')
@UseGuards(PermissionGuard)
export class DepartmentController {
  constructor(private readonly departments: DepartmentService) {}

  @Get()
  async list(): Promise<ListDepartmentsResponse> {
    return { departments: await this.departments.list() };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ department: DepartmentDto }> {
    return { department: await this.departments.findOne(id) };
  }

  @Post()
  @RequirePermission('department.manage')
  @UsePipes(new ZodValidationPipe(CreateDepartmentRequest))
  async create(@Body() body: CreateDepartmentRequest): Promise<CreateDepartmentResponse> {
    return { department: await this.departments.create(body) };
  }

  @Patch(':id')
  @RequirePermission('department.manage')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateDepartmentRequest)) body: UpdateDepartmentRequest,
  ): Promise<UpdateDepartmentResponse> {
    return { department: await this.departments.update(id, body) };
  }

  @Delete(':id')
  @RequirePermission('department.manage')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ ok: true }> {
    await this.departments.remove(id);
    return { ok: true };
  }
}
