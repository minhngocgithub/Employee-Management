import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';

class CostBreakdownDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare transport?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare accommodation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare per_diem?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare other?: number;
}

export class CreateBusinessTripDto extends CreateLeaveRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Địa điểm công tác không được để trống' })
  declare destination: string;

  @IsString()
  @IsNotEmpty({ message: 'Mục đích công tác không được để trống' })
  @MaxLength(500)
  declare purpose: string;

  @IsDateString({}, { message: 'departure_date không hợp lệ (YYYY-MM-DD)' })
  declare departure_date: string;

  @IsDateString({}, { message: 'return_date không hợp lệ (YYYY-MM-DD)' })
  declare return_date: string;

  @IsNumber({}, { message: 'total_days phải là số' })
  @Min(0.5, { message: 'total_days tối thiểu 0.5' })
  declare total_days: number;

  @IsOptional()
  @IsBoolean()
  declare request_booking?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'estimated_cost phải là số' })
  @Min(0, { message: 'estimated_cost không được âm' })
  declare estimated_cost?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CostBreakdownDto)
  declare cost_breakdown?: CostBreakdownDto;

  @IsOptional()
  @IsString()
  declare budget_approver_name?: string;
}
