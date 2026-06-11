import { SetMetadata } from '@nestjs/common';
import { Role } from '../../accounts/schema/account.schema';

export const ROLES_KEY = 'roles';

/**
 * Chỉ định role nào được phép truy cập route.
 * Kết hợp với RolesGuard.
 *
 * @example
 * @Roles(Role.ADMIN, Role.MANAGER)
 * @Get('stats')
 * getStats() {}
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
