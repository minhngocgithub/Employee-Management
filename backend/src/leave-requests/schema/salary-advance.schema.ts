import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

export enum SalaryAdvancePaymentMethod {
  BANK_TRANSFER = 'bank_transfer', // Chuyển khoản
  CASH = 'cash', // Tiền mặt
}

/**
 * Nhóm 3 — Tài chính & công tác
 * ─────────────────────────────────
 * SALARY ADVANCE — Tạm ứng lương
 */
@Schema()
export class SalaryAdvanceRequest extends LeaveRequest {
  /** Số tiền yêu cầu tạm ứng (VND) */
  @Prop({ type: Number, required: true, min: 1 })
  declare amount: number;

  /** Lý do tạm ứng */
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  /** Hình thức thanh toán */
  @Prop({ type: String, enum: SalaryAdvancePaymentMethod, required: true })
  declare payment_method: SalaryAdvancePaymentMethod;

  /** Thời hạn hoàn trả dự kiến */
  @Prop({ type: Date, required: true })
  declare repayment_due_date: Date;

  /**
   * Lịch khấu trừ lương — mô tả dạng text cho đơn giản.
   * Vd: "Khấu trừ 2 tháng, mỗi tháng 5.000.000 VND"
   */
  @Prop({ type: String, trim: true, default: null, maxlength: 300 })
  declare deduction_schedule: string | null;

  /**
   * Tên người phê duyệt tài chính (ghi nhận thông tin, không phải ObjectId).
   */
  @Prop({ type: String, trim: true, default: null })
  declare finance_approver_name: string | null;
}

export const SalaryAdvanceRequestSchema =
  SchemaFactory.createForClass(SalaryAdvanceRequest);
