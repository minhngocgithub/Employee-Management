import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DepartmentLevel } from '../schema/department.schema';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên phòng ban không được để trống' })
  @MaxLength(100)
  declare name: string;

  /**
   * Mã phòng ban: chỉ chứa chữ hoa và dấu gạch dưới, tối đa 20 ký tự.
   * Ví dụ: COMPANY, BOARD_TECH, DEPT_HR
   */
  @IsString()
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Mã phòng ban chỉ được chứa chữ hoa, số và dấu gạch dưới',
  })
  @MaxLength(20)
  declare code: string;

  @IsEnum(DepartmentLevel, { message: 'Level không hợp lệ' })
  declare level: DepartmentLevel;

  /**
   * Bắt buộc khi level = BOARD (2) hoặc DEPARTMENT (3).
   * Null khi level = COMPANY (1).
   */
  @IsOptional()
  @IsMongoId({ message: 'parent_id không hợp lệ' })
  parent_id?: string | null;

  @IsOptional()
  @IsMongoId({ message: 'manager_id không hợp lệ' })
  manager_id?: string | null;
}
