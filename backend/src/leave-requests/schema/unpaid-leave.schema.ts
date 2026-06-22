import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

export enum UnpaidLeaveUnit {
  FULL_DAY = 'full_day', // Toàn ngày
  HALF_DAY = 'half_day', // Nửa ngày
  BY_HOUR = 'by_hour', // Theo giờ
}

/**
 * Nhóm 1 — Nghỉ phép & vắng mặt
 * ─────────────────────────────────
 * UNPAID LEAVE — Nghỉ không lương
 */
@Schema()
export class UnpaidLeave extends LeaveRequest {
  @Prop({ type: String, enum: UnpaidLeaveUnit, required: true })
  declare unit: UnpaidLeaveUnit;

  @Prop({ type: Date, required: true })
  declare start_date: Date;

  @Prop({ type: Date, required: true })
  declare end_date: Date;

  /** Giờ bắt đầu — bắt buộc khi unit = BY_HOUR (format: "08:30") */
  @Prop({ type: String, default: null })
  declare start_time: string | null;

  /** Giờ kết thúc — bắt buộc khi unit = BY_HOUR */
  @Prop({ type: String, default: null })
  declare end_time: string | null;

  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  /** Ngày trở lại dự kiến */
  @Prop({ type: Date, required: true })
  declare expected_return_date: Date;
}

export const UnpaidLeaveSchema = SchemaFactory.createForClass(UnpaidLeave);

UnpaidLeaveSchema.pre('save', function () {
  if (this.end_date < this.start_date) {
    throw new Error('end_date must be >= start_date');
  }
  if (
    this.unit === UnpaidLeaveUnit.BY_HOUR &&
    (!this.start_time || !this.end_time)
  ) {
    throw new Error(
      'start_time and end_time are required when unit is BY_HOUR',
    );
  }
});
