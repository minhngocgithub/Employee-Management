import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Role } from '../schema/account.schema';

export class QueryAccountDto {
  @IsOptional()
  @IsEnum(Role, { message: 'Role không hợp lệ' })
  role?: Role;

  @IsOptional()
  @IsString()
  search?: string; // tìm theo email

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
