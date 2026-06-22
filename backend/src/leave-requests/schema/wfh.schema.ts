import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

export enum WfhUnit {
  FULL_DAY = 'full_day', // 1 ngày hoặc nhiều ngày
  BY_HOUR = 'by_hour', // Theo giờ
}

/**
 * Nhóm 2 — Chấm công & thời gian làm việc
 * ──────────────────────────────────────────
 * WFH — Làm việc từ xa
 */
@Schema()
export class WfhRequest extends LeaveRequest {
  @Prop({ type: String, enum: WfhUnit, required: true })
  declare unit: WfhUnit;

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

  /** Thiết bị / tài nguyên cần (laptop công ty, VPN, màn hình phụ...) */
  @Prop({ type: String, trim: true, default: null, maxlength: 300 })
  declare required_resources: string | null;

  /** Xác nhận đã đọc và đồng ý điều kiện WFH của công ty */
  @Prop({ type: Boolean, required: true })
  declare agreed_to_wfh_policy: boolean;
}

export const WfhRequestSchema = SchemaFactory.createForClass(WfhRequest);

WfhRequestSchema.pre('save', function () {
  if (this.end_date < this.start_date) {
    throw new Error('end_date must be >= start_date');
  }
  if (this.unit === WfhUnit.BY_HOUR && (!this.start_time || !this.end_time)) {
    throw new Error(
      'start_time and end_time are required when unit is BY_HOUR',
    );
  }
});
