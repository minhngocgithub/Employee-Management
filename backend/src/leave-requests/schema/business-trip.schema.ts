import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

/**
 * Nhóm 3 — Tài chính & công tác
 * ─────────────────────────────────
 * BUSINESS TRIP — Công tác
 */
@Schema()
export class BusinessTripRequest extends LeaveRequest {
  /** Địa điểm công tác */
  @Prop({ type: String, required: true, trim: true })
  declare destination: string;

  /** Mục đích công tác */
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare purpose: string;

  /** Ngày đi */
  @Prop({ type: Date, required: true })
  declare departure_date: Date;

  /** Ngày về */
  @Prop({ type: Date, required: true })
  declare return_date: Date;

  /** Tổng số ngày công tác (tính tự động hoặc nhập tay) */
  @Prop({ type: Number, required: true, min: 0.5 })
  declare total_days: number;

  /** Yêu cầu đặt vé / khách sạn thay không */
  @Prop({ type: Boolean, default: false })
  declare request_booking: boolean;

  /** Dự toán tổng chi phí (VND) */
  @Prop({ type: Number, default: null, min: 0 })
  declare estimated_cost: number | null;

  /**
   * Chi tiết dự toán chi phí.
   * Lưu dạng object đơn giản, đủ cho bài tập.
   */
  @Prop({
    type: {
      transport: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      per_diem: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    default: null,
  })
  declare cost_breakdown: {
    transport: number;
    accommodation: number;
    per_diem: number;
    other: number;
  } | null;

  /**
   * Tên người phê duyệt ngân sách (ghi nhận thông tin, không phải ObjectId).
   * Bài tập không cần multi-step approval.
   */
  @Prop({ type: String, trim: true, default: null })
  declare budget_approver_name: string | null;
}

export const BusinessTripRequestSchema =
  SchemaFactory.createForClass(BusinessTripRequest);

BusinessTripRequestSchema.pre('save', function () {
  if (this.return_date < this.departure_date) {
    throw new Error('return_date must be >= departure_date');
  }
});
