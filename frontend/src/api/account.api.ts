import { api } from 'src/lib/http';
import type { 
  PaginatedResult,
  Account,
  QueryAccountDto,
  Role,
} from 'src/types/api.types';

export interface ResetPasswordDto {
  newPassword: string;
}

export interface UpdateRoleDto {
  role: Role;
}

export const accountsApi = {
  /**
   * POST /accounts
   * Create new account (Admin only)
   */
  create(dto: {
    email: string;
    password: string;
    role: Role;
    department_id: string;
  }): Promise<Account> {
    return api.post<Account>('/accounts', dto).then((res) => res.data);
  },

  /**
   * GET /accounts
   * List all accounts (Admin only, with pagination)
   * Query params: role, search, status, page, limit
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
   * PATCH /accounts/:id/activate
   * Activate account from INACTIVE or LOCKED to ACTIVE (Admin only)
   */
  activate(id: string): Promise<Account> {
    return api
      .patch<Account>(`/accounts/${id}/activate`)
      .then((res) => res.data);
  },

  /**
   * PATCH /accounts/:id/lock
   * Lock an ACTIVE account to LOCKED status (Admin only)
   */
  lock(id: string): Promise<Account> {
    return api
      .patch<Account>(`/accounts/${id}/lock`)
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
