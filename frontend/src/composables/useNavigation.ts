import type { Role } from 'src/types/auth.types';

export interface NavItem {
  name: string;
  label: string;
  icon: string;
  to: { name: string };
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    name: 'home',
    label: 'Trang chủ',
    icon: 'home',
    to: { name: 'home' },
    roles: ['admin', 'hr', 'manager', 'employee'],
  },
  {
    name: 'admin-dashboard',
    label: 'Admin Dashboard',
    icon: 'dashboard',
    to: { name: 'admin-dashboard' },
    roles: ['admin'],
  },
  {
    name: 'manager-dashboard',
    label: 'Manager Dashboard',
    icon: 'dashboard',
    to: { name: 'manager-dashboard' },
    roles: ['manager'],
  },
  {
    name: 'employees',
    label: 'Nhân viên',
    icon: 'people',
    to: { name: 'employees' },
    roles: ['admin', 'hr', 'manager'],
  },
  {
    name: 'departments',
    label: 'Phòng ban',
    icon: 'domain',
    to: { name: 'departments' },
    roles: ['admin', 'manager', 'hr'],
  },
  {
    name: 'leave-requests',
    label: 'Đơn xin nghỉ phép',
    icon: 'event_note',
    to: { name: 'leave-requests' },
    roles: ['admin', 'manager', 'hr', 'employee'],
  },
  {
    name: 'audit-logs',
    label: 'Nhật ký hoạt động',
    icon: 'history',
    to: { name: 'audit-logs' },
    roles: ['admin'],
  },
];

export function getNavItemsForRole(role: Role | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getDefaultRouteName(role: Role | null): string {
  if (role === 'admin') return 'admin-dashboard';
  if (role === 'manager') return 'manager-dashboard';
  return 'home';
}
