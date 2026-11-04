import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Bloquea el acceso a rutas de cliente si el usuario autenticado es ADMIN (TS-027).
 * Debe ejecutarse después de un guard JWT (JwtAuthGuard u OptionalJwtGuard),
 * que es quien pone req.user. Los usuarios sin sesión pasan sin restricción.
 */
@Injectable()
export class NotAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: { role?: string } }>().user;
    if (user?.role === 'ADMIN') {
      throw new ForbiddenException('El administrador no puede usar rutas de cliente');
    }
    return true;
  }
}
