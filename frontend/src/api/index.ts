/**
 * Central API Export
 * All API methods are exported from here for easy importing
 */

export { authApi } from './auth.api';
export { employeeApi } from './employee.api';
export { departmentApi } from './department.api';
export { leaveRequestApi } from './leave-request.api';
export { dashboardApi } from './dashboard.api';

// For convenience, also export types
export type {
  // Employee types
  Employee,
  CreateEmployeeDto,
  CreateEmployeeResponseDto,
  UpdateEmployeeDto,
  QueryEmployeeDto,
  // Department types
  Department,
  DepartmentTree,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  AssignManagerDto,
  // Leave Request types
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  CreateLeaveRequestDto,
  ReviewLeaveRequestDto,
  QueryLeaveRequestDto,
  // Dashboard types
  AdminDashboardStats,
  ManagerDashboardStats,
  // Generic types
  PaginatedResult,
} from 'src/types/api.types';
export type { AuthUser, TokenResponse, LoginPayload, ChangePasswordPayload } from 'src/types/auth.types';
