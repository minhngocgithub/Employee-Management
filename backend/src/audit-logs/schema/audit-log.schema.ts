import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
export enum AuditEntity {
  EMPLOYEE = 'Employee',
  DEPARTMENT = 'Department',
  LEAVE_REQUEST = 'LeaveRequest',
  ACCOUNT = 'Account',
}

@Schema({
  // Không dùng timestamps mặc định, tự quản lý created_at
  timestamps: false,
  collection: 'audit_logs',
})
export class AuditLog {
  // Người thực hiện hành động
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  declare actor_id: Types.ObjectId;

  @Prop({ type: String, enum: AuditAction, required: true })
  declare action: AuditAction;

  @Prop({ type: String, enum: AuditEntity, required: true })
  declare entity: AuditEntity;

  // ID của record bị tác động
  @Prop({ type: Types.ObjectId, required: true })
  declare entity_id: Types.ObjectId;

  // Dữ liệu trước khi thay đổi (null khi CREATE)
  @Prop({ type: Object, default: null })
  declare before_data: Record<string, any> | null;

  // Dữ liệu sau khi thay đổi (null khi DELETE)
  @Prop({ type: Object, default: null })
  declare after_data: Record<string, any> | null;

  @Prop({ type: String, default: null })
  declare ip_address: string | null;

  @Prop({ type: Date, default: () => new Date() })
  declare created_at: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ actor_id: 1 });
AuditLogSchema.index({ entity: 1, entity_id: 1 });
AuditLogSchema.index({ created_at: -1 });
// Compound index cho query "ai làm gì với entity nào"
AuditLogSchema.index({ actor_id: 1, entity: 1, created_at: -1 });

// Audit log không được sửa hay xoá
AuditLogSchema.set('strict', true);
