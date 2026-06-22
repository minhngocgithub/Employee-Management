import { IsOptional, IsString } from 'class-validator';

export class ExportEmployeeDto {
  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  format?: 'xlsx' | 'csv'; // default: xlsx
}

export interface ImportEmployeeRow {
  row: number;
  full_name: string;
  personal_email: string;
  phone?: string;
  department_name: string; // resolve to department_id
  join_date: string; // YYYY-MM-DD
  date_of_birth?: string;
  gender?: string;
  address?: string;
  position?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
  created: { row: number; employee_code: string; company_email: string }[];
}
