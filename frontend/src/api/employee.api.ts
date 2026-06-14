import { api } from 'src/lib/http';
import type {
  Employee,
  CreateEmployeeDto,
  CreateEmployeeResponseDto,
  UpdateEmployeeDto,
  QueryEmployeeDto,
  PaginatedResult,
} from 'src/types/api.types';

export const employeeApi = {
  /**
   * POST /employees
   * Create a new employee (Admin, HR only)
   * Returns employee data + temporary_password
   */
  create(dto: CreateEmployeeDto): Promise<CreateEmployeeResponseDto> {
    return api
      .post<CreateEmployeeResponseDto>('/employees', dto)
      .then((res) => res.data);
  },

  /**
   * GET /employees
   * List employees with pagination and filtering
   * Manager only sees employees in their department
   */
  list(query?: QueryEmployeeDto): Promise<PaginatedResult<Employee>> {
    return api
      .get<PaginatedResult<Employee>>('/employees', { params: query })
      .then((res) => res.data);
  },

  /**
   * GET /employees/me
   * Get current logged-in user's employee data
   */
  getMe(): Promise<Employee> {
    return api.get<Employee>('/employees/me').then((res) => res.data);
  },

  /**
   * GET /employees/:id
   * Get single employee by ID
   */
  getById(id: string): Promise<Employee> {
    return api.get<Employee>(`/employees/${id}`).then((res) => res.data);
  },

  /**
   * PATCH /employees/:id
   * Update employee info (Admin, HR only)
   */
  update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    return api
      .patch<Employee>(`/employees/${id}`, dto)
      .then((res) => res.data);
  },

  /**
   * PATCH /employees/me/profile
   * Update own profile (any authenticated user)
   * Only allowed fields: full_name, phone, avatar_url, date_of_birth, gender, address
   */
  updateProfile(dto: Partial<UpdateEmployeeDto>): Promise<Employee> {
    return api
      .patch<Employee>('/employees/me/profile', dto)
      .then((res) => res.data);
  },

  /**
   * PATCH /employees/:id/resign
   * Mark employee as resigned (Admin, HR only)
   */
  resign(id: string): Promise<Employee> {
    return api
      .patch<Employee>(`/employees/${id}/resign`)
      .then((res) => res.data);
  },
};
