import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';

export class CreateOtherLeaveDto extends CreateLeaveRequestDto {
  @IsDateString({}, { message: 'start_date không hợp lệ (YYYY-MM-DD)' })
  declare start_date: string;

  @IsDateString({}, { message: 'end_date không hợp lệ (YYYY-MM-DD)' })
  declare end_date: string;

  @IsNumber({}, { message: 'total_days phải là số' })
  @Min(0.5, { message: 'total_days tối thiểu 0.5' })
  declare total_days: number;

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @MaxLength(500)
  declare reason: string;
}
