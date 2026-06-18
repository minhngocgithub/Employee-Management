import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  // Không cho phép đổi code và level sau khi tạo
  // Không cho phép đổi parent_id (sẽ phá vỡ cây hierarchy)

  @IsOptional()
  @IsMongoId({ message: 'manager_id không hợp lệ' })
  manager_id?: string | null;

  @IsOptional()
  @IsMongoId({ message: 'acting_manager_id không hợp lệ' })
  acting_manager_id?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
