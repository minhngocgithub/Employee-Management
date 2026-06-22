export type Role = 'admin' | 'hr' | 'manager' | 'employee' | 'manager_hr';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  department_id: string;
  employee_id: string | null;
  must_change_password: boolean;
  /** true nếu đang được ủy quyền tạm thời */
  is_acting_manager: boolean;
  /** ngày hết hạn ủy quyền (ISO string) */
  acting_until?: string | null;
}

export interface TokenResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}