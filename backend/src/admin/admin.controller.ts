import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private service: AdminService) {}

  // Users
  @Get('users')
  @RequirePermission('admin:read')
  getUsers() { return this.service.getUsers(); }

  @Get('users/:id')
  @RequirePermission('admin:read')
  getUser(@Param('id', ParseIntPipe) id: number) { return this.service.getUser(id); }

  @Post('users')
  @RequirePermission('admin:create')
  createUser(@Body() dto: any) { return this.service.createUser(dto); }

  @Put('users/:id')
  @RequirePermission('admin:update')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.updateUser(id, dto); }

  @Post('users/:id/roles')
  @RequirePermission('admin:update')
  assignRoles(@Param('id', ParseIntPipe) id: number, @Body('roleIds') roleIds: number[]) {
    return this.service.assignRoles(id, roleIds);
  }

  // Roles
  @Get('roles')
  @RequirePermission('admin:read')
  getRoles() { return this.service.getRoles(); }

  @Post('roles')
  @RequirePermission('admin:create')
  createRole(@Body() dto: any) { return this.service.createRole(dto); }

  @Put('roles/:id')
  @RequirePermission('admin:update')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.updateRole(id, dto); }

  @Delete('roles/:id')
  @RequirePermission('admin:delete')
  deleteRole(@Param('id', ParseIntPipe) id: number) { return this.service.deleteRole(id); }

  // Permissions
  @Get('permissions')
  @RequirePermission('admin:read')
  getPermissions() { return this.service.getPermissions(); }

  @Patch('roles/:roleId/permissions/:permissionId')
  @RequirePermission('admin:update')
  togglePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @Body('grant') grant: boolean,
  ) { return this.service.togglePermission(roleId, permissionId, grant); }
}
