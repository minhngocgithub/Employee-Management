import { api } from 'src/lib/http';
import type {
  Department,
  DepartmentTree,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentEmployee,
} from 'src/types/api.types';

export const departmentApi = {
  /**
   * POST /departments
   * Create a new department (Admin only)
   */
  create(dto: CreateDepartmentDto): Promise<Department> {
    return api
      .post<Department>('/departments', dto)
      .then((res) => res.data);
  },

  /**
   * GET /departments
   * List all active departments
   * ?includeInactive=true - Admin can see inactive departments
   */
  list(
    includeInactive?: boolean,
    search?: string,
  ): Promise<Department[]> {
    return api
      .get<Department[]>('/departments', {
        params: {
          includeInactive,
          search,
        },
      })
      .then((res) => res.data)
  },

  /**
   * GET /departments/tree
   * Get hierarchical tree structure (3-level deep)
   * Used for organization chart display
   */
  getTree(): Promise<DepartmentTree[]> {
    return api
      .get<DepartmentTree[]>('/departments/tree')
      .then((res) => res.data);
  },

  /**
   * GET /departments/:id
   * Get single department by ID
   */
  getById(id: string): Promise<Department> {
    return api
      .get<Department>(`/departments/${id}`)
      .then((res) => res.data);
  },

  /**
   * GET /departments/:id/children
   * Get direct child departments
   */
  getChildren(id: string): Promise<Department[]> {
    return api
      .get<Department[]>(`/departments/${id}/children`)
      .then((res) => res.data);
  },

  /**
   * PATCH /departments/:id
   * Update department info (Admin only)
   * Can update: name, code, description, is_active
   */
  update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    return api
      .patch<Department>(`/departments/${id}`, dto)
      .then((res) => res.data);
  },

  /**
   * PATCH /departments/:id/manager
   * Assign or remove manager for a department (Admin only)
   * manager_id can be null to remove manager
   */
  assignManager(id: string, managerId: string | null): Promise<Department> {
    return api
      .patch<Department>(`/departments/${id}/manager`, { manager_id: managerId })
      .then((res) => res.data);
  },

  /**
   * PATCH /departments/:id/acting-manager
   * Assign or remove acting manager (must differ from manager_id)
   */
  setActingManager(
    id: string,
    actingManagerId: string | null,
  ): Promise<Department> {
    return api
      .patch<Department>(`/departments/${id}/acting-manager`, {
        acting_manager_id: actingManagerId,
      })
      .then((res) => res.data);
  },

  /**
   * GET /departments/:id/employees
   * Get all employees in a department (name, position, email, etc.)
   */
  getEmployees(id: string): Promise<DepartmentEmployee[]> {
    return api
      .get<DepartmentEmployee[]>(`/departments/${id}/employees`)
      .then((res) => res.data);
  },

  /**
   * DELETE /departments/:id
   * Soft delete department - marks as inactive (Admin only)
   */
  delete(id: string): Promise<{ message: string }> {
    return api
      .delete<{ message: string }>(`/departments/${id}`)
      .then((res) => res.data);
  },
};
