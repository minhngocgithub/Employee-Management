import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';

export enum MaternityLeaveType {
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  CHILDCARE = 'childcare',
}

export class CreateMaternityLeaveDto extends CreateLeaveRequestDto {
  @IsEnum(MaternityLeaveType, { message: 'maternity_type không hợp lệ' })
  declare maternity_type: MaternityLeaveType;

  @IsDateString({}, { message: 'start_date không hợp lệ (YYYY-MM-DD)' })
  declare start_date: string;

  @IsDateString(
    {},
    { message: 'expected_return_date không hợp lệ (YYYY-MM-DD)' },
  )
  declare expected_return_date: string;

  @IsOptional()
  @IsBoolean()
  declare request_position_hold?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  declare emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  declare emergency_contact_phone?: string;

  @IsOptional()
  @IsBoolean()
  declare has_supporting_documents?: boolean;
}
