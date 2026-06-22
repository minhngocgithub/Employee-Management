import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

/**
 * DTO cho PATCH /leave-requests/:id
 *
 * Update không cần biết loại đơn — chỉ cho phép sửa:
 *   1. attachment_urls  — file đính kèm
 *   2. internal_note    — ghi chú nội bộ (service guard theo role)
 *   3. Bất kỳ field metadata nào khác qua index signature
 *
 * Validation đặc thù (start_date, end_date, start_time...) nằm ở
 * schema pre-save hook — service truyền thẳng payload xuống model.
 *
 * Lý do không dùng UpdateOvertimeDto / UpdateWfhDto... riêng:
 *   - Employee chỉ sửa đơn PENDING của mình
 *   - Thường chỉ cần sửa 1-2 field nhỏ
 *   - Schema pre-save hook đã là safety net cuối cùng
 */
export class UpdateLeaveRequestDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'internal_note không được vượt quá 500 ký tự' })
  declare internal_note?: string;

  /**
   * Các field đặc thù của từng loại đơn (start_date, end_date, reason,
   * start_time, end_time...) được nhận qua index signature.
   * Validation đặc thù do schema pre-save hook đảm nhiệm.
   */
  [key: string]: unknown;
}
