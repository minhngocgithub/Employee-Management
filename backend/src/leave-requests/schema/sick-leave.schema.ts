import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

/**
 * Nhóm 1 — Nghỉ phép & vắng mặt
 * ─────────────────────────────────
 * SICK LEAVE — Nghỉ ốm
 */
@Schema()
export class SickLeave extends LeaveRequest {
  @Prop({ type: Date, required: true })
  declare start_date: Date;

  @Prop({ type: Date, required: true })
  declare end_date: Date;

  @Prop({ type: Number, required: true, min: 0.5 })
  declare total_days: number;

  /** Triệu chứng / lý do nghỉ ốm */
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  /**
   * Có giấy tờ y tế không (giấy khám bệnh, đơn thuốc...).
   * File thực tế nằm trong attachment_urls của base schema.
   */
  @Prop({ type: Boolean, default: false })
  declare has_medical_certificate: boolean;
}

export const SickLeaveSchema = SchemaFactory.createForClass(SickLeave);

SickLeaveSchema.pre('save', function () {
  if (this.end_date < this.start_date) {
    throw new Error('end_date must be >= start_date');
  }
});
