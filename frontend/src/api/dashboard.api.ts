import { api } from 'src/lib/http';
import type {
  AdminDashboardStats,
  ManagerDashboardStats,
} from 'src/types/api.types';

export const dashboardApi = {
  /**
   * GET /dashboard/stats
   * Get dashboard statistics based on user role
   * - Admin: system-wide statistics
   * - Manager: department statistics
   */
  getStats(): Promise<AdminDashboardStats | ManagerDashboardStats> {
    return api
      .get<AdminDashboardStats | ManagerDashboardStats>('/dashboard/stats')
      .then((res) => res.data);
  },
};
