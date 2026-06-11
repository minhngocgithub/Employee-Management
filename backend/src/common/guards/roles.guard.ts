import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../accounts/schema/account.schema';
import { AuthenticatedUser } from '../../auth/strategies/jwt-payload.interface';

/**
 * Guard kiểm tra role.
 * Phải dùng sau JwtAuthGuard (req.user đã có).
 *
 * - Không có metadata @Roles() → cho qua (chỉ cần đăng nhập).
 * - Có @Roles() → role của user phải nằm trong danh sách cho phép.
 *
 * Đăng ký global trong AppModule:
 *   { provide: APP_GUARD, useClass: RolesGuard }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Không yêu cầu role cụ thể → chỉ cần đăng nhập là đủ
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }

    return true;
  }
}
