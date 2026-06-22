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

export enum WfhUnit {
  FULL_DAY = 'full_day',
  BY_HOUR = 'by_hour',
}

export class CreateWfhDto extends CreateLeaveRequestDto {
  @IsEnum(WfhUnit, { message: 'unit không hợp lệ' })
  declare unit: WfhUnit;

  @IsDateString({}, { message: 'start_date không hợp lệ (YYYY-MM-DD)' })
  declare start_date: string;

  @IsDateString({}, { message: 'end_date không hợp lệ (YYYY-MM-DD)' })
  declare end_date: string;

  /** Bắt buộc khi unit = BY_HOUR */
  @ValidateIf((o: CreateWfhDto) => o.unit === WfhUnit.BY_HOUR)
  @IsTimeString({ message: 'start_time phải đúng định dạng HH:mm' })
  declare start_time?: string;

  /** Bắt buộc khi unit = BY_HOUR, phải sau start_time */
  @ValidateIf((o: CreateWfhDto) => o.unit === WfhUnit.BY_HOUR)
  @IsTimeString({ message: 'end_time phải đúng định dạng HH:mm' })
  @EndTimeAfterStart('start_time')
  declare end_time?: string;

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @MaxLength(500)
  declare reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  declare required_resources?: string;

  @IsBoolean({ message: 'Phải xác nhận đồng ý điều kiện WFH' })
  declare agreed_to_wfh_policy: boolean;
}
