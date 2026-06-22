import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';

export class CreateAnnualLeaveDto extends CreateLeaveRequestDto {
  @IsDateString({}, { message: 'start_date không hợp lệ (YYYY-MM-DD)' })
  declare start_date: string;

  @IsDateString({}, { message: 'end_date không hợp lệ (YYYY-MM-DD)' })
  declare end_date: string;

  @IsNumber({}, { message: 'total_days phải là số' })
  @Min(0.5, { message: 'total_days tối thiểu 0.5' })
  declare total_days: number;

  @IsNumber({}, { message: 'remaining_days_before phải là số' })
  @Min(0, { message: 'remaining_days_before không được âm' })
  declare remaining_days_before: number;

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @MaxLength(500, { message: 'Lý do không được vượt quá 500 ký tự' })
  declare reason: string;

  @IsOptional()
  @IsBoolean()
  declare use_unpaid_if_exhausted?: boolean;
}
