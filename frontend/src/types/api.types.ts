export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export type EmployeeStatus = 'active' | 'resigned';
// Employee
export interface Employee {
  _id: string;
  // GET /employees populate account_id → { _id, email }
  // Các endpoint khác (getMe, getById) trả raw string — dùng union để an toàn
  account_id: { _id: string; email: string } | string;
  employee_code: string;
  full_name: string;
  personal_email?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  department_id: string;
  position?: string;
  start_date: string;
  join_date: string;         // ← đổi từ start_date
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}
export interface CreateEmployeeDto {
  full_name: string
  personal_email: string
  phone?: string
  avatar_url?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  department_id: string
  position?: string
  join_date: string

}

export interface CreateEmployeeResponseDto {
  message: string
  company_email: string
  employee_code: string
  employee: Employee
}

export interface UpdateEmployeeDto {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  department_id?: string;
  position?: string;
  salary?: number;
}

export interface QueryEmployeeDto {
  search?: string;
  department_id?: string;
  status?: 'active' | 'resigned' | 'all';
  page?: number;
  limit?: number;
}

// ========== Department Types ==========
export type DepartmentLevel = 1 | 2 | 3; // 1=Company, 2=Board, 3=Department

export interface Department {
  _id: string;
  name: string;
  code: string;
  level: DepartmentLevel;
  manager_id?: string;
  acting_manager_id?: string | null;
  parent_id?: string;
  acting_until?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface DepartmentEmployee {
  _id: string;
  full_name: string;
  position?: string;
  account_id?: {
    _id: string;
    email: string;
  };
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
  description?: string;
  is_active?: boolean;
}

export interface AssignManagerDto {
  manager_id: string | null;
}

export interface AssignActingManagerDto {
  acting_manager_id: string | null;
}

// ========== Leave Request Types ==========
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'other';

export interface LeaveRequest {
  _id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLeaveRequestDto {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface UpdateLeaveRequestDto {
  leave_type?: LeaveType;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

export interface ReviewLeaveRequestDto {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
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

// ========== Dashboard Types (khớp backend /dashboard/stats) ==========
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
  active: number;
  inactive: number;
  resigned: number;
}

export interface AdminDashboardStats {
  total_employees: number;
  active_employees: number;
  resigned_employees: number;
  total_departments: number;
  headcount_by_department: HeadcountByDepartment[];
  leave_stats_this_month: LeaveStats;
  leave_stats_all_time: LeaveStats;
}

export interface ManagerDashboardStats {
  department_id: string;
  total_employees: number;
  active_employees: number;
  leave_stats_this_month: LeaveStats;
  pending_reviews: number;
}