import { Employee } from '../schema/employee.schema';

export class CreateEmployeeResponseDto {
  declare message: string;
  declare company_email: string;
  declare employee_code: string;
  declare employee: Employee;
}
