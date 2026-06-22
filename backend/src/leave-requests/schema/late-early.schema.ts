import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

export enum LateEarlyType {
  LATE_ARRIVAL = 'late_arrival', // Đi muộn
  EARLY_DEPARTURE = 'early_departure', // Về sớm
  TEMPORARY_ABSENCE = 'temporary_absence', // Rời tạm thời
}

/**
 * Nhóm 2 — Chấm công & thời gian làm việc
 * ──────────────────────────────────────────
 * LATE / EARLY / TEMP ABSENCE — Đi muộn / Về sớm / Rời tạm thời
 * 1 discriminator duy nhất, phân biệt qua late_early_type.
 */
@Schema()
export class LateEarlyRequest extends LeaveRequest {
  @Prop({ type: String, enum: LateEarlyType, required: true })
  declare late_early_type: LateEarlyType;

  /** Ngày xảy ra */
  @Prop({ type: Date, required: true })
  declare incident_date: Date;

  /**
   * Giờ đến thực tế (LATE_ARRIVAL) hoặc giờ về thực tế (EARLY_DEPARTURE).
   * Format: "09:15"
   */
  @Prop({ type: String, required: true })
  declare actual_time: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  /** Có yêu cầu bù giờ không */
  @Prop({ type: Boolean, default: false })
  declare request_makeup_time: boolean;

  /** Thời gian bù giờ dự kiến (format: "17:30–18:30") — điền khi request_makeup_time = true */
  @Prop({ type: String, default: null })
  declare makeup_start_time: string | null; // "17:30"

  @Prop({ type: String, default: null })
  declare makeup_end_time: string | null;
}

export const LateEarlyRequestSchema =
  SchemaFactory.createForClass(LateEarlyRequest);
