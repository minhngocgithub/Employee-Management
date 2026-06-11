import { Role } from '../../accounts/schema/account.schema';

/**
 * Payload được encode vào access token và refresh token.
 * sub = account._id (string)
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  department_id: string;
}

/**
 * Shape của req.user sau khi guard xác thực xong.
 * Được gắn vào request bởi JwtStrategy / JwtRefreshStrategy.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  department_id: string;
}
