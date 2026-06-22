import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

export enum CorrectionType {
  FIX_CHECKIN_CHECKOUT = 'fix_checkin_checkout', // Sửa thời gian quẹt thẻ
  ADD_SHIFT = 'add_shift', // Thêm ca bị thiếu
  REMOVE_WRONG_RECORD = 'remove_wrong_record', // Xóa bản ghi sai
  ADJUST_OT = 'adjust_ot', // Điều chỉnh OT
}

/**
 * Nhóm 2 — Chấm công & thời gian làm việc
 * ──────────────────────────────────────────
 * ATTENDANCE CORRECTION — Đề nghị cập nhật công
 */
@Schema()
export class AttendanceCorrectionRequest extends LeaveRequest {
  @Prop({ type: String, enum: CorrectionType, required: true })
  declare correction_type: CorrectionType;

  /** Ngày liên quan cần chỉnh sửa */
  @Prop({ type: Date, required: true })
  declare incident_date: Date;

  /** Thời gian hiện tại trong hệ thống — giờ vào (format: "08:00") */
  @Prop({ type: String, default: null })
  declare current_start_time: string | null;

  /** Thời gian hiện tại trong hệ thống — giờ ra */
  @Prop({ type: String, default: null })
  declare current_end_time: string | null;

  /** Thời gian đề nghị sửa — giờ vào */
  @Prop({ type: String, default: null })
  declare requested_start_time: string | null;

  /** Thời gian đề nghị sửa — giờ ra */
  @Prop({ type: String, default: null })
  declare requested_end_time: string | null;

  /** Lý do sửa sai */
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  /**
   * Bằng chứng (ảnh chụp thẻ, email, camera log...).
   * File thực tế nằm trong attachment_urls của base schema.
   */
  @Prop({ type: Boolean, default: false })
  declare has_evidence: boolean;

  /** Có ảnh hưởng đến lương / OT không */
  @Prop({ type: Boolean, default: false })
  declare affects_payroll: boolean;

  /** Mô tả ảnh hưởng lương/OT — điền khi affects_payroll = true */
  @Prop({ type: String, trim: true, default: null, maxlength: 300 })
  declare payroll_impact_description: string | null;
}

export const AttendanceCorrectionRequestSchema = SchemaFactory.createForClass(
  AttendanceCorrectionRequest,
);
