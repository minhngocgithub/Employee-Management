import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';
import { IsTimeString } from '../../../common/validators/is-time-string.validator';
import { EndTimeAfterStart } from '../../../common/validators/end-time-after-start.validator';

export enum OvertimePayType {
  PAID = 'paid',
  COMPENSATED = 'compensated',
}

export class CreateOvertimeDto extends CreateLeaveRequestDto {
  @IsArray({ message: 'overtime_dates phải là mảng' })
  @ArrayMinSize(1, { message: 'overtime_dates phải có ít nhất 1 ngày' })
  @IsDateString(
    {},
    {
      each: true,
      message: 'Mỗi ngày trong overtime_dates phải đúng định dạng YYYY-MM-DD',
    },
  )
  declare overtime_dates: string[];

  @IsTimeString({
    message: 'start_time phải đúng định dạng HH:mm (ví dụ: 18:00)',
  })
  declare start_time: string;

  @IsTimeString({
    message: 'end_time phải đúng định dạng HH:mm (ví dụ: 21:30)',
  })
  @EndTimeAfterStart('start_time')
  declare end_time: string;

  @IsNumber({}, { message: 'estimated_hours phải là số' })
  @Min(0.5, { message: 'estimated_hours tối thiểu 0.5' })
  declare estimated_hours: number;

  @IsString()
  @IsNotEmpty({
    message: 'Mục đích / công việc cần làm thêm không được để trống',
  })
  @MaxLength(500)
  declare work_purpose: string;

  @IsBoolean({ message: 'Phải xác nhận đồng ý làm thêm giờ' })
  declare agreed_to_overtime: boolean;

  @IsEnum(OvertimePayType, { message: 'pay_type không hợp lệ' })
  declare pay_type: OvertimePayType;
}
