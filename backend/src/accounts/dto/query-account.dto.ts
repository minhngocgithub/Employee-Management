import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AccountStatus, Role } from '../schema/account.schema';

export class QueryAccountDto {
  @IsOptional()
  @IsEnum(Role, {
    message: `role phải là một trong: ${Object.values(Role).join(', ')}`,
  })
  role?: Role;

  /**
   * Lọc theo trạng thái tài khoản (US-313).
   * Giá trị hợp lệ: inactive | active | locked
   */
  @IsOptional()
  @IsEnum(AccountStatus, {
    message: `status phải là một trong: ${Object.values(AccountStatus).join(', ')}`,
  })
  status?: AccountStatus;

  /** Tìm kiếm theo email hoặc tên nhân viên (US-312) */
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
