import { IsDateString, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveStatus, LeaveType } from '../schema/leave-request.schema';

export class QueryLeaveRequestDto {
  @IsOptional()
  @IsEnum(LeaveStatus, { message: 'Status không hợp lệ' })
  status?: LeaveStatus;

  @IsOptional()
  @IsEnum(LeaveType, { message: 'Loại nghỉ phép không hợp lệ' })
  leave_type?: LeaveType;

  // Lọc theo nhân viên cụ thể (Admin/HR/Manager dùng)
  @IsOptional()
  @IsMongoId({ message: 'employee_id không hợp lệ' })
  employee_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from_date không hợp lệ' })
  from_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to_date không hợp lệ' })
  to_date?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
