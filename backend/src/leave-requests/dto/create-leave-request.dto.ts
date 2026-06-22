import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { LeaveType } from '../schema/leave-request.schema';

/**
 * Base DTO — chỉ chứa field chung cho MỌI loại đơn.
 * Mỗi loại đơn extend class này và khai báo thêm field đặc thù.
 *
 * KHÔNG đặt start_date / end_date / reason ở đây vì:
 *   - Một số loại không có date range (OVERTIME, RESIGNATION...)
 *   - Validation ngày/giờ khác nhau theo từng loại
 */
export class CreateLeaveRequestDto {
  @IsEnum(LeaveType, { message: 'leave_type không hợp lệ' })
  declare leave_type: LeaveType;

  /**
   * URL file đính kèm — upload lên storage trước, truyền URL vào.
   * Optional, mặc định [].
   */
  @IsOptional()
  @IsArray({ message: 'attachment_urls phải là mảng' })
  @IsUrl(
    {},
    {
      each: true,
      message: 'Mỗi phần tử của attachment_urls phải là URL hợp lệ',
    },
  )
  declare attachment_urls?: string[];

  /**
   * Ghi chú nội bộ — service sẽ guard, chỉ ADMIN/MANAGER/HR/MANAGER_HR được lưu.
   * Employee gửi lên sẽ bị bỏ qua.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'internal_note không được vượt quá 500 ký tự' })
  declare internal_note?: string;
}
