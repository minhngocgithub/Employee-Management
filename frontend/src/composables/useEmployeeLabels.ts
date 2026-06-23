import type { EmployeeStatus } from 'src/types/api.types';

// ─── Options cho dropdown/filter ─────────────────────────────────────────────

export const EMPLOYEE_STATUS_OPTIONS: { label: string; value: EmployeeStatus | 'all' }[] = [
  { label: 'Đang làm việc', value: 'working' },
  { label: 'Nghỉ hưu', value: 'retired' },
  { label: 'Nghỉ việc', value: 'resigned' },
  { label: 'Chưa kích hoạt', value: null },
  { label: 'Tất cả', value: 'all' },
];

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
