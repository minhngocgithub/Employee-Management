import { api } from 'src/lib/http';
import type {
  AdminDashboardStats,
  ManagerDashboardStats,
  LeaveRequest,
  PaginatedResult,
} from 'src/types/api.types';

export interface AuditLog {
  _id?: string;
  actor: string;
  entity: string;
  action: string;
  details: string;
  timestamp: string;
}

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

  /**
   * GET /audit-logs
   * Get recent activities/audit logs
   * Limited to recent entries
   */
  getRecentActivities(limit: number = 10): Promise<PaginatedResult<AuditLog>> {
    return api
      .get<PaginatedResult<AuditLog>>('/audit-logs', {
        params: { limit, skip: 0, sortBy: 'timestamp', sortOrder: 'DESC' },
      })
      .then((res) => res.data);
  },

  /**
   * GET /leave-requests
   * Get leave requests to analyze request types
   */
  getLeaveRequests(): Promise<PaginatedResult<LeaveRequest>> {
    return api
      .get<PaginatedResult<LeaveRequest>>('/leave-requests', {
        params: { limit: 100, skip: 0 },
      })
      .then((res) => res.data);
  },
};
