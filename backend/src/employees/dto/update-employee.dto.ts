import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Gender, EmployeeStatus } from '../schema/employee.schema';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  full_name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s()]{7,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string | null;

  @IsOptional()
  @IsString()
  avatar_url?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ (YYYY-MM-DD)' })
  date_of_birth?: string | null;

  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string | null;

  @IsOptional()
  @IsMongoId({ message: 'department_id không hợp lệ' })
  department_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày vào làm không hợp lệ (YYYY-MM-DD)' })
  join_date?: string;

  /**
   * HR cập nhật sau khi Admin kích hoạt tài khoản.
   * Các giá trị hợp lệ: working | retired | resigned
   */
  @IsOptional()
  @IsEnum(EmployeeStatus, {
    message: 'Trạng thái nhân viên không hợp lệ (working | retired | resigned)',
  })
  status?: EmployeeStatus;
}
