import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

/**
 * Nhóm 1 — Nghỉ phép & vắng mặt
 * ─────────────────────────────────
 * OTHER LEAVE — Nghỉ khác
 */
@Schema()
export class OtherLeave extends LeaveRequest {
  @Prop({ type: Date, required: true })
  declare start_date: Date;

  @Prop({ type: Date, required: true })
  declare end_date: Date;

  @Prop({ type: Number, required: true, min: 0.5 })
  declare total_days: number;

  /** Lý do cụ thể */
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;
}

export const OtherLeaveSchema = SchemaFactory.createForClass(OtherLeave);

OtherLeaveSchema.pre('save', function () {
  if (this.end_date < this.start_date) {
    throw new Error('end_date must be >= start_date');
  }
});
