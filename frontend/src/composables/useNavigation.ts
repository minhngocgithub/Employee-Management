import type { Role } from 'src/types/auth.types';

export interface NavItem {
  name: string;
  label: string;
  icon: string;
  to: { name: string };
  roles: string[]; // Các role được phép truy cập
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
    name: 'my-leave-requests',
    label: 'Đơn nghỉ của tôi',
    icon: 'event_available',
    to: { name: 'my-leave-requests' },
    roles: ['employee', 'manager', 'hr'],
  },
  {
    name: 'leave-requests',
    label: 'Duyệt đơn nghỉ phép',
    icon: 'event_note',
    to: { name: 'leave-requests' },
    roles: ['admin', 'manager', 'hr'],
  },
  {
    name: 'audit-logs',
    label: 'Nhật ký hoạt động',
    icon: 'manage_search',
    to: { name: 'audit-logs' },
    roles: ['admin'],
  },
  {
    name: 'login-history',
    label: 'Lịch sử đăng nhập',
    icon: 'login',
    to: { name: 'login-history' },
    roles: ['admin'],
  },
];

export function getNavItemsForRole(
  role: Role | null,
  isActingManager = false,
): NavItem[] {
  if (!role) return [];
  const normalizedRole = role.toLowerCase() as Role;
  return NAV_ITEMS.filter((item) => {
    if (item.roles.includes(normalizedRole)) return true;
    // Acting manager (role=employee) được thấy menu duyệt đơn
    if (isActingManager && item.name === 'leave-requests') return true;
    return false;
  });
}

export function getDefaultRouteName(role: Role | null): string {
  if (role === 'admin') return 'admin-dashboard';
  if (role === 'manager') return 'manager-dashboard';
  return 'home';
}