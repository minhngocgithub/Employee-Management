import type { EmployeeStatus } from 'src/types/api.types';

// ─── Options cho dropdown/filter ─────────────────────────────────────────────

export const EMPLOYEE_STATUS_OPTIONS = [
  { label: 'Đang làm việc', value: 'working' as EmployeeStatus },
  { label: 'Nghỉ hưu', value: 'retired' as EmployeeStatus },
  { label: 'Nghỉ việc', value: 'resigned' as EmployeeStatus },
  { label: 'Chưa kích hoạt', value: null as EmployeeStatus },
  { label: 'Tất cả', value: 'all' as const },
] as const;

// ─── Label maps ───────────────────────────────────────────────────────────────

const EMPLOYEE_STATUS_LABELS: Record<Exclude<EmployeeStatus, null>, string> = {
  working: 'Đang làm việc',
  retired: 'Nghỉ hưu',
  resigned: 'Nghỉ việc',
} as const;

const EMPLOYEE_STATUS_COLORS: Record<Exclude<EmployeeStatus, null>, string> = {
  working: 'green',
  retired: 'blue',
  resigned: 'orange',
} as const;

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getEmployeeStatusLabel(status: EmployeeStatus): string {
  if (status === null) {
    return 'Chưa kích hoạt';
  }
  return EMPLOYEE_STATUS_LABELS[status] ?? status;
}

export function getEmployeeStatusColor(status: EmployeeStatus): string {
  if (status === null) {
    return 'grey';
  }
  return EMPLOYEE_STATUS_COLORS[status] ?? 'grey';
}
