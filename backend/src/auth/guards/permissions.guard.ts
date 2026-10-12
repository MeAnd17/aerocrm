import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Acceso denegado');

    // Admin role bypasses all permission checks
    if (user.roles && user.roles.includes('Admin')) return true;

    const hasPermission = required.every(perm => user.permissions?.includes(perm));
    if (!hasPermission) throw new ForbiddenException('No tienes permiso para realizar esta acción');
    return true;
  }
}
