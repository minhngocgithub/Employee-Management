import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from '../schema/employee.schema';

export class QueryEmployeeDto {
  /**
   * Tìm theo full_name hoặc employee_code (text search).
   */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId({ message: 'department_id không hợp lệ' })
  department_id?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus, { message: 'Status không hợp lệ' })
  status?: EmployeeStatus;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
