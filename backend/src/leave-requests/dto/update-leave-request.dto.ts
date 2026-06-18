import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { LeaveType } from '../schema/leave-request.schema';

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsEnum(LeaveType, { message: 'Loại nghỉ phép không hợp lệ' })
  declare leave_type?: LeaveType;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)' })
  declare start_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ (YYYY-MM-DD)' })
  declare end_date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @MaxLength(500, { message: 'Lý do không được vượt quá 500 ký tự' })
  declare reason?: string;
}
