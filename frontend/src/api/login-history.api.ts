import { api } from 'src/lib/http';

export type LoginAction = 'login' | 'logout';

export interface LoginHistoryRecord {
  _id: string;
  account_id: {
    _id: string;
    email: string;
  } | string; // populated hoặc raw ObjectId string
  action: LoginAction;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LoginHistoryResponse {
  data: LoginHistoryRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LoginStatRecord {
  _id: string; // "YYYY-MM-DD"
  count: number;
}

export const loginHistoryApi = {
  /**
   * GET /login-history
   * - Admin: xem tất cả, có thể filter theo account_id
   * - Others: chỉ xem của mình
   */
  list(params?: {
    page?: number;
    limit?: number;
    account_id?: string;
  }): Promise<LoginHistoryResponse> {
    return api
      .get<LoginHistoryResponse>('/login-history', { params })
      .then((res) => res.data);
  },

  /**
   * GET /login-history/stats
   * Admin only. Thống kê đăng nhập theo ngày.
   */
  getStats(days?: number): Promise<LoginStatRecord[]> {
    return api
      .get<LoginStatRecord[]>('/login-history/stats', { params: { days } })
      .then((res) => res.data);
  },
};