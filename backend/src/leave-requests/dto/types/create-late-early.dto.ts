import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';
import { IsTimeString } from '../../../common/validators/is-time-string.validator';
import { EndTimeAfterStart } from '../../../common/validators/end-time-after-start.validator';

export enum LateEarlyType {
  LATE_ARRIVAL = 'late_arrival',
  EARLY_DEPARTURE = 'early_departure',
  TEMPORARY_ABSENCE = 'temporary_absence',
}

export class CreateLateEarlyDto extends CreateLeaveRequestDto {
  @IsEnum(LateEarlyType, { message: 'late_early_type không hợp lệ' })
  declare late_early_type: LateEarlyType;

  @IsDateString({}, { message: 'incident_date không hợp lệ (YYYY-MM-DD)' })
  declare incident_date: string;

  /** Giờ đến thực tế / giờ về thực tế — bắt buộc, format HH:mm */
  @IsTimeString({
    message: 'actual_time phải đúng định dạng HH:mm (ví dụ: 09:15)',
  })
  declare actual_time: string;

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @MaxLength(500)
  declare reason: string;

  @IsOptional()
  @IsBoolean()
  declare request_makeup_time?: boolean;

  /**
   * Giờ bắt đầu bù — bắt buộc khi request_makeup_time = true.
   * Tách thành 2 field riêng thay vì free text "17:30–18:30".
   */
  @ValidateIf((o: CreateLateEarlyDto) => !!o.request_makeup_time)
  @IsTimeString({ message: 'makeup_start_time phải đúng định dạng HH:mm' })
  declare makeup_start_time?: string;

  /** Giờ kết thúc bù — phải sau makeup_start_time */
  @ValidateIf((o: CreateLateEarlyDto) => !!o.request_makeup_time)
  @IsTimeString({ message: 'makeup_end_time phải đúng định dạng HH:mm' })
  @EndTimeAfterStart('makeup_start_time')
  declare makeup_end_time?: string;
}
