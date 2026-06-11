import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/strategies/jwt-payload.interface';

import { Request } from 'express';

/**
 * Lấy thông tin user đã xác thực từ request.
 * Chỉ dùng được trong các route đã qua JwtAuthGuard.
 *
 * @example
 * @Get('me')
 * getMe(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 *
 * // Lấy 1 field cụ thể:
 * getMe(@CurrentUser('id') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;

    return field ? user?.[field] : user;
  },
);
