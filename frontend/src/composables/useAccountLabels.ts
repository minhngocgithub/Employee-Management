import type { AccountStatus, Role } from 'src/types/api.types';

// ─── Options cho dropdown/filter ─────────────────────────────────────────────

export const ACCOUNT_STATUS_OPTIONS: { label: string; value: AccountStatus }[] = [
  { label: 'Hoạt động', value: 'active' },
  { label: 'Chưa kích hoạt', value: 'inactive' },
  { label: 'Bị khóa', value: 'locked' },
];

export const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: 'Quản trị viên', value: 'admin' },
  { label: 'Nhân sự', value: 'hr' },
  { label: 'Quản lý', value: 'manager' },
  { label: 'Quản lý & Nhân sự', value: 'manager_hr' },
  { label: 'Nhân viên', value: 'employee' },
];

// ─── Label maps ───────────────────────────────────────────────────────────────

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'Hoạt động',
  inactive: 'Chưa kích hoạt',
  locked: 'Bị khóa',
};

const ACCOUNT_STATUS_COLORS: Record<AccountStatus, string> = {
  active: 'green',
  inactive: 'grey',
  locked: 'red',
};

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Quản trị viên',
  hr: 'Nhân sự',
  manager: 'Quản lý',
  manager_hr: 'Quản lý & Nhân sự',
  employee: 'Nhân viên',
};

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getAccountStatusLabel(status: AccountStatus): string {
  return ACCOUNT_STATUS_LABELS[status] ?? status;
}

export function getAccountStatusColor(status: AccountStatus): string {
  return ACCOUNT_STATUS_COLORS[status] ?? 'grey';
}

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}
