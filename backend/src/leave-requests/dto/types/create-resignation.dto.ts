import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';

export enum ResignationType {
  VOLUNTARY = 'voluntary',
  MUTUAL = 'mutual',
  TERMINATED = 'terminated',
}

export class CreateResignationDto extends CreateLeaveRequestDto {
  @IsEnum(ResignationType, { message: 'resignation_type không hợp lệ' })
  declare resignation_type: ResignationType;

  @IsDateString({}, { message: 'submission_date không hợp lệ (YYYY-MM-DD)' })
  declare submission_date: string;

  @IsDateString(
    {},
    { message: 'expected_last_working_date không hợp lệ (YYYY-MM-DD)' },
  )
  declare expected_last_working_date: string;

  @IsString()
  @IsNotEmpty({ message: 'Lý do thôi việc không được để trống' })
  @MaxLength(500)
  declare reason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare handover_items?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare final_settlement_notes?: string;

  @IsOptional()
  @IsString()
  declare contract_termination_approver?: string;
}
