import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';
import { IsTimeString } from '../../../common/validators/is-time-string.validator';
import { EndTimeAfterStart } from '../../../common/validators/end-time-after-start.validator';

export enum UnpaidLeaveUnit {
  FULL_DAY = 'full_day',
  HALF_DAY = 'half_day',
  BY_HOUR = 'by_hour',
}

export class CreateUnpaidLeaveDto extends CreateLeaveRequestDto {
  @IsEnum(UnpaidLeaveUnit, { message: 'unit không hợp lệ' })
  declare unit: UnpaidLeaveUnit;

  @IsDateString({}, { message: 'start_date không hợp lệ (YYYY-MM-DD)' })
  declare start_date: string;

  @IsDateString({}, { message: 'end_date không hợp lệ (YYYY-MM-DD)' })
  declare end_date: string;

  /** Bắt buộc khi unit = BY_HOUR */
  @ValidateIf((o: CreateUnpaidLeaveDto) => o.unit === UnpaidLeaveUnit.BY_HOUR)
  @IsTimeString({ message: 'start_time phải đúng định dạng HH:mm' })
  declare start_time?: string;

  /** Bắt buộc khi unit = BY_HOUR, phải sau start_time */
  @ValidateIf((o: CreateUnpaidLeaveDto) => o.unit === UnpaidLeaveUnit.BY_HOUR)
  @IsTimeString({ message: 'end_time phải đúng định dạng HH:mm' })
  @EndTimeAfterStart('start_time')
  declare end_time?: string;

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @MaxLength(500)
  declare reason: string;

  @IsDateString(
    {},
    { message: 'expected_return_date không hợp lệ (YYYY-MM-DD)' },
  )
  declare expected_return_date: string;
}
