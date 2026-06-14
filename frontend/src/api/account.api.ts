import { api } from 'src/lib/http';
import type { PaginatedResult } from 'src/types/api.types';

export interface Account {
  _id: string;
  email: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  is_active: boolean;
  department_id: string;
  employee_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryAccountDto {
  role?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface ResetPasswordDto {
  newPassword: string;
}

export interface UpdateRoleDto {
  role: 'admin' | 'hr' | 'manager' | 'employee';
}

export const accountsApi = {
  /**
   * POST /accounts
   * Create new account (Admin only)
   */
  create(dto: {
    email: string;
    password: string;
    role: string;
    department_id: string;
  }): Promise<Account> {
    return api.post<Account>('/accounts', dto).then((res) => res.data);
  },

  /**
   * GET /accounts
   * List all accounts (Admin only, with pagination)
   */
  list(query?: QueryAccountDto): Promise<PaginatedResult<Account>> {
    return api
      .get<PaginatedResult<Account>>('/accounts', { params: query })
      .then((res) => res.data);
  },

  /**
   * GET /accounts/:id
   * Get specific account (Admin only)
   */
  getById(id: string): Promise<Account> {
    return api.get<Account>(`/accounts/${id}`).then((res) => res.data);
  },

  /**
   * PATCH /accounts/:id/role
   * Update account role (Admin only)
   */
  updateRole(id: string, dto: UpdateRoleDto): Promise<Account> {
    return api
      .patch<Account>(`/accounts/${id}/role`, dto)
      .then((res) => res.data);
  },

  /**
   * PATCH /accounts/:id/toggle-active
   * Toggle account active status (Admin only)
   */
  toggleActive(id: string): Promise<Account> {
    return api
      .patch<Account>(`/accounts/${id}/toggle-active`)
      .then((res) => res.data);
  },

  /**
   * PATCH /accounts/:id/reset-password
   * Reset account password to temporary (Admin only)
   */
  resetPassword(id: string, dto: ResetPasswordDto): Promise<{ message: string }> {
    return api
      .patch<{ message: string }>(`/accounts/${id}/reset-password`, dto)
      .then((res) => res.data);
  },
};
