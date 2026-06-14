export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Employee
export interface Employee {
  _id: string;
  account_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  department_id: string;
  position?: string;
  start_date: string;
  end_date?: string;
  salary?: number;
  is_active: boolean;
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
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// ========== Leave Request Types ==========
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'other';

export interface LeaveRequest {
  _id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
  status: LeaveStatus;
  reviewer_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveRequestDto {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface ReviewLeaveRequestDto {
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface QueryLeaveRequestDto {
  status?: LeaveStatus;
  employee_id?: string;
  start_date?: string;
  end_date?: string;
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