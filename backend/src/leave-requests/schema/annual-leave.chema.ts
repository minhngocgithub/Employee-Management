import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

/**
 * Nhóm 1 — Nghỉ phép & vắng mặt
 * ─────────────────────────────────
 * ANNUAL LEAVE — Nghỉ phép năm
 */
@Schema()
export class AnnualLeave extends LeaveRequest {
  /** Ngày bắt đầu nghỉ */
  @Prop({ type: Date, required: true })
  declare start_date: Date;

  /** Ngày kết thúc nghỉ */
  @Prop({ type: Date, required: true })
  declare end_date: Date;

  /** Tổng số ngày nghỉ */
  @Prop({ type: Number, required: true, min: 0.5 })
  declare total_days: number;

  /** Số ngày phép còn lại trước khi xin */
  @Prop({ type: Number, required: true, min: 0 })
  declare remaining_days_before: number;

  /** Lý do nghỉ */
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  /** Có dùng phép không lương nếu hết phép năm không */
  @Prop({ type: Boolean, default: false })
  declare use_unpaid_if_exhausted: boolean;
}

export const AnnualLeaveSchema = SchemaFactory.createForClass(AnnualLeave);

AnnualLeaveSchema.pre('save', function () {
  if (this.end_date < this.start_date) {
    throw new Error('end_date must be >= start_date');
  }
});
