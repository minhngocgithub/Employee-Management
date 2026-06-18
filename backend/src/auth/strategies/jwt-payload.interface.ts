import { Role } from '../../accounts/schema/account.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  department_id: string;
  /** true nếu account đang được ủy quyền tạm thời */
  is_acting_manager?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  department_id: string;
  is_acting_manager: boolean;
}
