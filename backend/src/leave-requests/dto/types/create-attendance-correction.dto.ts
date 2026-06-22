import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';
import { IsTimeString } from '../../../common/validators/is-time-string.validator';

export enum CorrectionType {
  FIX_CHECKIN_CHECKOUT = 'fix_checkin_checkout',
  ADD_SHIFT = 'add_shift',
  REMOVE_WRONG_RECORD = 'remove_wrong_record',
  ADJUST_OT = 'adjust_ot',
}

export class CreateAttendanceCorrectionDto extends CreateLeaveRequestDto {
  @IsEnum(CorrectionType, { message: 'correction_type không hợp lệ' })
  declare correction_type: CorrectionType;

  @IsDateString({}, { message: 'incident_date không hợp lệ (YYYY-MM-DD)' })
  declare incident_date: string;

  @IsOptional()
  @IsTimeString({ message: 'current_start_time phải đúng định dạng HH:mm' })
  declare current_start_time?: string;

  @IsOptional()
  @IsTimeString({ message: 'current_end_time phải đúng định dạng HH:mm' })
  declare current_end_time?: string;

  @IsOptional()
  @IsTimeString({ message: 'requested_start_time phải đúng định dạng HH:mm' })
  declare requested_start_time?: string;

  @IsOptional()
  @IsTimeString({ message: 'requested_end_time phải đúng định dạng HH:mm' })
  declare requested_end_time?: string;

  @IsString()
  @IsNotEmpty({ message: 'Lý do sửa không được để trống' })
  @MaxLength(500)
  declare reason: string;

  @IsOptional()
  @IsBoolean()
  declare has_evidence?: boolean;

  @IsOptional()
  @IsBoolean()
  declare affects_payroll?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  declare payroll_impact_description?: string;
}
