import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaveRequestDocument = LeaveRequest & Document;

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum LeaveType {
  // Nhóm 1: Nghỉ phép & vắng mặt
  ANNUAL = 'annual', // Nghỉ phép năm
  SICK = 'sick', // Nghỉ ốm
  UNPAID = 'unpaid', // Nghỉ không lương
  MATERNITY = 'maternity', // Nghỉ thai sản
  OTHER_LEAVE = 'other_leave', // Nghỉ khác

  // Nhóm 2: Chấm công & thời gian làm việc
  WFH = 'wfh', // Làm việc từ xa
  SHIFT_CHANGE = 'shift_change', // Đổi ca
  LATE_EARLY = 'late_early', // Đi muộn / Về sớm / Rời tạm thời
  OVERTIME = 'overtime', // Đăng ký làm thêm
  ATTENDANCE_CORRECTION = 'attendance_correction', // Đề nghị cập nhật công

  // Nhóm 3: Tài chính & công tác
  BUSINESS_TRIP = 'business_trip', // Công tác
  SALARY_ADVANCE = 'salary_advance', // Tạm ứng lương

  // Nhóm 4: Quan hệ lao động
  RESIGNATION = 'resignation', // Thôi việc
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// ─── Base Schema ──────────────────────────────────────────────────────────────
// discriminatorKey = 'leave_type' → Mongoose tự route đúng sub-schema
// theo giá trị của trường này.

@Schema({
  timestamps: true,
  collection: 'leave_requests',
  discriminatorKey: 'leave_type',
})
export class LeaveRequest {
  /** Nhân viên tạo đơn */
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  declare employee_id: Types.ObjectId;

  declare leave_type: LeaveType;

  @Prop({ type: String, enum: LeaveStatus, default: LeaveStatus.PENDING })
  declare status: LeaveStatus;

  /** Account người duyệt / từ chối (Manager / HR / Admin) */
  @Prop({ type: Types.ObjectId, ref: 'Account', default: null })
  declare reviewed_by: Types.ObjectId | null;

  /** Bắt buộc khi status = REJECTED */
  @Prop({ type: String, trim: true, default: null, maxlength: 500 })
  declare rejection_reason: string | null;

  @Prop({ type: Date, default: null })
  declare reviewed_at: Date | null;

  /**
   * Mảng URL file đính kèm (upload lên storage trước, truyền URL vào).
   * Employee được upload khi tạo/sửa đơn.
   */
  @Prop({ type: [String], default: [] })
  declare attachment_urls: string[];

  /**
   * Ghi chú nội bộ — chỉ Manager / HR / Admin được ghi.
   * Employee không thấy / không sửa được field này.
   */
  @Prop({ type: String, trim: true, default: null, maxlength: 1000 })
  declare internal_note: string | null;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

// ─── Indexes ──────────────────────────────────────────────────────────────────

LeaveRequestSchema.index({ employee_id: 1 });
LeaveRequestSchema.index({ leave_type: 1 });
LeaveRequestSchema.index({ status: 1 });
LeaveRequestSchema.index({ reviewed_by: 1 });
LeaveRequestSchema.index({ employee_id: 1, status: 1 }); // dashboard
LeaveRequestSchema.index({ leave_type: 1, status: 1 }); // filter theo nhóm
LeaveRequestSchema.index({ createdAt: -1 }); // lịch sử đơn từ

// ─── Pre-save hook (base) ────────────────────────────────────────────────────

LeaveRequestSchema.pre('save', function () {
  if (this.status === LeaveStatus.REJECTED && !this.rejection_reason) {
    throw new Error('rejection_reason is required when status is REJECTED');
  }
});
