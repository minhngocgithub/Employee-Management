import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Gender } from '../schema/employee.schema';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(100)
  declare full_name: string;

  /** Email cá nhân — hệ thống gửi thông tin đăng nhập tới địa chỉ này */
  @IsEmail({}, { message: 'Email cá nhân không hợp lệ' })
  declare personal_email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s()]{7,20}$/, { message: 'Số điện thoại không hợp lệ' })
  declare phone?: string | null;

  @IsOptional()
  @IsString()
  declare avatar_url?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ (YYYY-MM-DD)' })
  declare date_of_birth?: string | null;

  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  declare gender?: Gender | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  declare position?: string | null;

  @IsMongoId({ message: 'department_id không hợp lệ' })
  declare department_id: string;

  @IsDateString({}, { message: 'Ngày vào làm không hợp lệ (YYYY-MM-DD)' })
  declare join_date: string;
}
