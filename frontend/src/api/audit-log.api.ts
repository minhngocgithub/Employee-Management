import { api } from 'src/lib/http';
import type { PaginatedResult } from 'src/types/api.types';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type AuditEntity = 'Employee' | 'Department' | 'LeaveRequest' | 'Account';

export interface AuditLog {
  _id: string;

  actor_id: {
    _id: string;

    employee_id: {
      _id: string;
      employee_code: string;
      full_name: string;
    } | null;
  } | null;

  action: AuditAction;
  entity: AuditEntity;
  entity_id: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface QueryAuditLogDto {
  actor_id?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  entity_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export const auditLogApi = {
  /**
   * GET /audit-logs
   * Admin only. Filter by actor, entity, action, date range.
   */
  list(query?: QueryAuditLogDto): Promise<PaginatedResult<AuditLog>> {
    return api
      .get<PaginatedResult<AuditLog>>('/audit-logs', { params: query })
      .then((res) => res.data);
  },
};