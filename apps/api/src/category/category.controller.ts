import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  AssignDepartmentsRequest,
  type CategoryResponse,
} from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CategoryService } from './category.service.js';

@Controller('categories')
@UseGuards(PermissionGuard)
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Post()
  @RequirePermission('category.manage')
  @UsePipes(new ZodValidationPipe(CreateCategoryRequest))
  create(@Body() body: CreateCategoryRequest): Promise<CategoryResponse> {
    return this.categories.create(body);
  }

  @Get()
  @RequirePermission('category.manage')
  list(): Promise<CategoryResponse[]> {
    return this.categories.list();
  }

  @Get(':id')
  @RequirePermission('category.manage')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryResponse> {
    return this.categories.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('category.manage')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateCategoryRequest)) body: UpdateCategoryRequest,
  ): Promise<CategoryResponse> {
    return this.categories.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('category.manage')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categories.remove(id);
  }

  @Post(':id/departments')
  @RequirePermission('category.manage')
  assignDepartments(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(AssignDepartmentsRequest)) body: AssignDepartmentsRequest,
  ): Promise<void> {
    return this.categories.assignDepartments(id, body.departmentIds);
  }
}