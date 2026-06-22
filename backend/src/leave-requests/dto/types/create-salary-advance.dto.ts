import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CreateLeaveRequestDto } from '../create-leave-request.dto';

export enum SalaryAdvancePaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

export class CreateSalaryAdvanceDto extends CreateLeaveRequestDto {
  @IsNumber({}, { message: 'amount phải là số' })
  @Min(1, { message: 'Số tiền tạm ứng phải lớn hơn 0' })
  declare amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Lý do tạm ứng không được để trống' })
  @MaxLength(500)
  declare reason: string;

  @IsEnum(SalaryAdvancePaymentMethod, {
    message: 'payment_method không hợp lệ',
  })
  declare payment_method: SalaryAdvancePaymentMethod;

  @IsDateString({}, { message: 'repayment_due_date không hợp lệ (YYYY-MM-DD)' })
  declare repayment_due_date: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  declare deduction_schedule?: string;

  @IsOptional()
  @IsString()
  declare finance_approver_name?: string;
}
