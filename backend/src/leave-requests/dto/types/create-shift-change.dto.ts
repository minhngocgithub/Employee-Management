import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';

export class CreateShiftChangeDto extends CreateLeaveRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'current_shift không được để trống' })
  declare current_shift: string;

  @IsString()
  @IsNotEmpty({ message: 'requested_shift không được để trống' })
  declare requested_shift: string;

  @IsArray({ message: 'apply_dates phải là mảng' })
  @ArrayMinSize(1, { message: 'apply_dates phải có ít nhất 1 ngày' })
  @IsDateString(
    {},
    {
      each: true,
      message: 'Mỗi ngày trong apply_dates phải đúng định dạng YYYY-MM-DD',
    },
  )
  declare apply_dates: string[];

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @MaxLength(500)
  declare reason: string;

  @IsOptional()
  @IsString()
  declare swap_employee_code?: string;

  @IsOptional()
  @IsString()
  declare swap_employee_name?: string;
}
