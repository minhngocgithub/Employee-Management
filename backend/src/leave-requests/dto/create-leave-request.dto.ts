import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { LeaveType } from '../schema/leave-request.schema';

/**
 * Custom decorator: start_date phải >= today + N ngày.
 * Dùng để enforce rule nộp đơn trước ít nhất 2 ngày.
 */
function MinDaysFromNow(days: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'minDaysFromNow',
      target: (object as { constructor: new (...args: unknown[]) => unknown })
        .constructor,
      propertyName,
      constraints: [days],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const minDays = args.constraints[0] as number;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const minDate = new Date(today);
          minDate.setDate(minDate.getDate() + minDays);
          const inputDate = new Date(value);
          inputDate.setHours(0, 0, 0, 0);
          return inputDate >= minDate;
        },
        defaultMessage(args: ValidationArguments) {
          const minDays = args.constraints[0] as number;
          return `Bạn phải nộp đơn trước ${minDays} ngày so với ngày nghỉ`;
        },
      },
    });
  };
}

export class CreateLeaveRequestDto {
  @IsEnum(LeaveType, { message: 'Loại nghỉ phép không hợp lệ' })
  declare leave_type: LeaveType;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)' })
  @MinDaysFromNow(2)
  declare start_date: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ (YYYY-MM-DD)' })
  declare end_date: string;

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @MaxLength(500, { message: 'Lý do không được vượt quá 500 ký tự' })
  declare reason: string;
}
