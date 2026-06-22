import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

/**
 * Nhóm 2 — Chấm công & thời gian làm việc
 * ──────────────────────────────────────────
 * SHIFT CHANGE — Đổi ca
 */
@Schema()
export class ShiftChangeRequest extends LeaveRequest {
  /** Ca hiện tại (vd: "Ca sáng 06:00–14:00") */
  @Prop({ type: String, required: true, trim: true })
  declare current_shift: string;

  /** Ca đề nghị đổi sang */
  @Prop({ type: String, required: true, trim: true })
  declare requested_shift: string;

  /** Ngày(s) áp dụng đổi ca */
  @Prop({ type: [Date], required: true })
  declare apply_dates: Date[];

  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  /** Mã nhân viên đổi ca cùng */
  @Prop({ type: String, trim: true, default: null })
  declare swap_employee_code: string | null;

  /** Tên nhân viên đổi ca cùng */
  @Prop({ type: String, trim: true, default: null })
  declare swap_employee_name: string | null;
}

export const ShiftChangeRequestSchema =
  SchemaFactory.createForClass(ShiftChangeRequest);

ShiftChangeRequestSchema.pre('save', function () {
  if (!this.apply_dates || this.apply_dates.length === 0) {
    throw new Error('apply_dates must have at least one date');
  }
});
