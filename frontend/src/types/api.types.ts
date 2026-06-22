export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== Account Types ==========
export type AccountStatus = 'inactive' | 'active' | 'locked';
export type Role = 'admin' | 'hr' | 'manager' | 'employee' | 'manager_hr';

export interface Account {
  _id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  failed_login_attempts: number;
  department_id: string;
  employee_id?: string | null;
  is_first_login: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryAccountDto {
  role?: Role;
  search?: string;
  status?: AccountStatus;
  page?: number;
  limit?: number;
}

// ========== Employee Types ==========
/**
 * null  = chưa xác định (tài khoản chưa được Admin kích hoạt)
 * HR cập nhật sau khi Admin kích hoạt tài khoản.
 */
export type EmployeeStatus = 'working' | 'retired' | 'resigned' | null;

export interface Employee {
  _id: string;
  account_id: { _id: string; email: string } | string;
  employee_code: string;
  full_name: string;
  personal_email?: string;
  phone?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  address?: string | null;
  department_id: string;
  position?: string | null;
  join_date: string;
  end_date?: string | null;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  full_name: string;
  personal_email: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  department_id: string;
  position?: string;
  join_date: string;
}

export interface CreateEmployeeResponseDto {
  message: string;
  company_email: string;
  employee_code: string;
  employee: Employee;
}

export interface UpdateEmployeeDto {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  address?: string | null;
  department_id?: string;
  position?: string | null;
  join_date?: string;
  /** Chỉ HR được cập nhật */
  status?: EmployeeStatus;
}

export interface QueryEmployeeDto {
  search?: string;
  department_id?: string;
  status?: EmployeeStatus | 'all';
  page?: number;
  limit?: number;
}

// ========== Department Types ==========
export type DepartmentLevel = 1 | 2 | 3;

export interface Department {
  _id: string;
  name: string;
  code: string;
  level: DepartmentLevel;
  manager_id?: string | null;
  acting_manager_id?: string | null;
  acting_until?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentEmployee {
  _id: string;
  full_name: string;
  position?: string | null;
  account_id?: { _id: string; email: string };
}

export interface DepartmentTree extends Department {
  children: DepartmentTree[];
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  level: DepartmentLevel;
  parent_id?: string;
  manager_id?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export interface AssignManagerDto {
  manager_id: string | null;
}

export interface AssignActingManagerDto {
  acting_manager_id: string | null;
  acting_until?: string | null;
}

// ========== Leave Request Types ==========
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type LeaveType =
  // Nhóm 1 — Nghỉ phép & vắng mặt
  | 'annual'
  | 'sick'
  | 'unpaid'
  | 'maternity'
  | 'other_leave'
  // Nhóm 2 — Chấm công & thời gian làm việc
  | 'wfh'
  | 'shift_change'
  | 'late_early'
  | 'overtime'
  | 'attendance_correction'
  // Nhóm 3 — Tài chính & công tác
  | 'business_trip'
  | 'salary_advance'
  // Nhóm 4 — Quan hệ lao động
  | 'resignation';

export interface LeaveRequest {
  _id: string;
  employee_id: string | { _id: string; full_name: string; employee_code: string };
  leave_type: LeaveType;
  status: LeaveStatus;
  reviewed_by?: string | { _id: string; email: string } | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  attachment_urls: string[];
  internal_note?: string | null; // Ẩn với Employee
  createdAt: string;
  updatedAt: string;
  // Metadata động — field tùy loại đơn
  [key: string]: unknown;
}

export interface CreateLeaveRequestDto {
  leave_type: LeaveType;
  attachment_urls?: string[];
  // Các field đặc thù từng loại truyền thêm
  [key: string]: unknown;
}

export interface UpdateLeaveRequestDto {
  attachment_urls?: string[];
  [key: string]: unknown;
}

export interface ReviewLeaveRequestDto {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
  internal_note?: string;
}

export interface QueryLeaveRequestDto {
  status?: LeaveStatus;
  leave_type?: LeaveType;
  employee_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

// ========== Dashboard Types ==========
export interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  by_type: Record<LeaveType, number>;
}

export interface HeadcountByDepartment {
  department_id: string;
  department_name: string;
  total: number;
  working: number;   // Đi làm
  retired: number;   // Nghỉ hưu
  resigned: number;  // Nghỉ việc
  pending: number;   // Chưa xác định (status = null)
}

export interface AdminDashboardStats {
  total_employees: number;
  working_employees: number;
  retired_employees: number;
  resigned_employees: number;
  pending_employees: number;
  total_departments: number;
  headcount_by_department: HeadcountByDepartment[];
  leave_stats_this_month: LeaveStats;
  leave_stats_all_time: LeaveStats;
}

export interface ManagerDashboardStats {
  department_id: string;
  total_employees: number;
  working_employees: number;
  leave_stats_this_month: LeaveStats;
  pending_reviews: number;
}
