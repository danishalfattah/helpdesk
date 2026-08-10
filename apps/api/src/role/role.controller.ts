import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionRequest,
  type RoleResponse,
} from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { RoleService } from './role.service.js';

@Controller()
@UseGuards(PermissionGuard)
export class RoleController {
  constructor(private readonly roles: RoleService) {}

  @Get('permissions')
  @RequirePermission('role.manage')
  listPermissions() {
    return this.roles.listPermissions();
  }

  @Post('roles')
  @RequirePermission('role.manage')
  @UsePipes(new ZodValidationPipe(CreateRoleRequest))
  create(@Body() body: CreateRoleRequest): Promise<RoleResponse> {
    return this.roles.create(body);
  }

  @Get('roles')
  @RequirePermission('role.manage')
  list(): Promise<RoleResponse[]> {
    return this.roles.list();
  }

  @Get('roles/:id')
  @RequirePermission('role.manage')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleResponse> {
    return this.roles.findById(id);
  }

  @Patch('roles/:id')
  @RequirePermission('role.manage')
  @UsePipes(new ZodValidationPipe(UpdateRoleRequest))
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateRoleRequest): Promise<RoleResponse> {
    return this.roles.update(id, body);
  }

  @Delete('roles/:id')
  @RequirePermission('role.manage')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.roles.remove(id);
  }

  @Post('roles/:id/permissions')
  @RequirePermission('role.manage')
  @UsePipes(new ZodValidationPipe(AssignPermissionRequest))
  assignPermission(@Param('id', ParseIntPipe) id: number, @Body() body: AssignPermissionRequest): Promise<void> {
    return this.roles.assignPermission(id, body.permissionId);
  }

  @Delete('roles/:id/permissions/:permissionId')
  @RequirePermission('role.manage')
  removePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<void> {
    return this.roles.removePermission(id, permissionId);
  }
}