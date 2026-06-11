import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaveRequestDocument = LeaveRequest & Document;

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  UNPAID = 'unpaid',
  OTHER = 'other',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}
@Schema({ timestamps: true, collection: 'leave_requests' })
export class LeaveRequest {
  // Nguoi tao don
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  declare employee_id: Types.ObjectId;

  @Prop({ type: String, enum: LeaveType, required: true })
  declare leave_type: LeaveType;

  @Prop({ type: Date, required: true })
  declare start_date: Date;

  @Prop({ type: Date, required: true })
  declare end_date: Date;

  // Tinh tu dong
  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  declare reason: string;

  @Prop({ type: String, enum: LeaveStatus, default: LeaveStatus.PENDING })
  declare status: LeaveStatus;

  // Account nguoi duyet/tu choi (Manager/Admin)
  @Prop({ type: Types.ObjectId, ref: 'Account', default: null })
  declare reviewed_by: Types.ObjectId | null;

  // Ly do tu choi, bat buoc khi status = Rejected
  @Prop({ type: String, trim: true, default: null })
  declare rejection_reason: string | null;

  @Prop({ type: Date, default: null })
  declare reviewed_at: Date | null;
}
export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

LeaveRequestSchema.index({ employee_id: 1 });
LeaveRequestSchema.index({ status: 1 });
LeaveRequestSchema.index({ reviewed_by: 1 });
LeaveRequestSchema.index({ start_date: 1, end_date: 1 });

// Query theo nhan vien + trang thai (dashboard)
LeaveRequestSchema.index({ employee_id: 1, status: 1 });
// Validate: end_date phải >= start_date
LeaveRequestSchema.pre('save', function () {
  if (this.end_date < this.start_date) {
    throw new Error('end_date must be greater than or equal to start_date');
  }

  if (this.status === LeaveStatus.REJECTED && !this.rejection_reason) {
    throw new Error('rejection_reason is required when status is REJECTED');
  }
});
