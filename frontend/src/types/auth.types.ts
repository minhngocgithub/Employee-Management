export type Role = 'admin' | 'hr' | 'manager' | 'employee';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  department_id: string;
  employee_id: string | null;
  must_change_password: boolean;
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
