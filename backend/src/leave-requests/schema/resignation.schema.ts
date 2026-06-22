import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

export enum ResignationType {
  VOLUNTARY = 'voluntary', // Nghỉ việc chủ động
  MUTUAL = 'mutual', // Nghỉ theo thỏa thuận
  TERMINATED = 'terminated', // Bị chấm dứt hợp đồng
}

export enum HandoverStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/**
 * Nhóm 4 — Quan hệ lao động
 * ─────────────────────────────
 * RESIGNATION — Thôi việc
 *
 * Lưu ý: Luồng này độc lập với employees.service.resign().
 * Employee tự nộp đơn qua đây. HR chỉnh sửa employee status riêng.
 */
@Schema()
export class ResignationRequest extends LeaveRequest {
  @Prop({ type: String, enum: ResignationType, required: true })
  declare resignation_type: ResignationType;

  /** Ngày nộp đơn (mặc định = createdAt, nhưng cho phép ghi nhận riêng) */
  @Prop({ type: Date, required: true })
  declare submission_date: Date;

  /** Ngày chấm dứt hợp đồng dự kiến */
  @Prop({ type: Date, required: true })
  declare expected_last_working_date: Date;

  /** Lý do thôi việc */
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  /** Tình trạng bàn giao */
  @Prop({
    type: String,
    enum: HandoverStatus,
    default: HandoverStatus.NOT_STARTED,
  })
  declare handover_status: HandoverStatus;

  /**
   * Danh sách công việc / tài sản bàn giao.
   * Mảng string mô tả từng hạng mục, đủ đơn giản cho bài tập.
   */
  @Prop({ type: [String], default: [] })
  declare handover_items: string[];

  /**
   * Yêu cầu thanh toán cuối — mô tả dạng text cho đơn giản.
   * Vd: "Lương tháng 6, 3 ngày phép tồn, trợ cấp thôi việc"
   */
  @Prop({ type: String, trim: true, default: null, maxlength: 500 })
  declare final_settlement_notes: string | null;

  /**
   * Tên người phê duyệt chấm dứt hợp đồng (ghi nhận thông tin).
   */
  @Prop({ type: String, trim: true, default: null })
  declare contract_termination_approver: string | null;
}

export const ResignationRequestSchema =
  SchemaFactory.createForClass(ResignationRequest);

ResignationRequestSchema.pre('save', function () {
  if (this.expected_last_working_date < this.submission_date) {
    throw new Error('expected_last_working_date must be >= submission_date');
  }
});
