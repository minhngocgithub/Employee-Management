import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

export enum OvertimePayType {
  PAID = 'paid', // Thanh toán tiền OT
  COMPENSATED = 'compensated', // Bù bằng ngày nghỉ
}

/**
 * Nhóm 2 — Chấm công & thời gian làm việc
 * ──────────────────────────────────────────
 * OVERTIME — Đăng ký làm thêm giờ
 */
@Schema()
export class OvertimeRequest extends LeaveRequest {
  /** Ngày(s) làm thêm */
  @Prop({ type: [Date], required: true })
  declare overtime_dates: Date[];

  /** Giờ bắt đầu làm thêm (format: "18:00") */
  @Prop({ type: String, required: true })
  declare start_time: string;

  /** Giờ kết thúc (format: "21:00") */
  @Prop({ type: String, required: true })
  declare end_time: string;

  /** Dự kiến tổng số giờ OT */
  @Prop({ type: Number, required: true, min: 0.5 })
  declare estimated_hours: number;

  /** Mục đích / công việc cần làm thêm */
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare work_purpose: string;

  /** Xác nhận đồng ý làm ngoài giờ */
  @Prop({ type: Boolean, required: true })
  declare agreed_to_overtime: boolean;

  /** Hình thức thanh toán OT */
  @Prop({ type: String, enum: OvertimePayType, required: true })
  declare pay_type: OvertimePayType;
}

export const OvertimeRequestSchema =
  SchemaFactory.createForClass(OvertimeRequest);

OvertimeRequestSchema.pre('save', function () {
  if (!this.overtime_dates || this.overtime_dates.length === 0) {
    throw new Error('overtime_dates must have at least one date');
  }
  if (this.start_time && this.end_time) {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    if (toMin(this.end_time) <= toMin(this.start_time))
      throw new Error('end_time must be after start_time');
  }
});
