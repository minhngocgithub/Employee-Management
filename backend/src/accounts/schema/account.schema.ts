import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountDocument = Account & Document;

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  HR = 'hr',
  EMPLOYEE = 'employee',
  MANAGER_HR = 'manager_hr',
}

export enum AccountStatus {
  INACTIVE = 'inactive', // Chưa kích hoạt — hệ thống tự set khi tạo mới
  ACTIVE = 'active', // Đã kích hoạt — Admin set thủ công
  LOCKED = 'locked', // Khóa — hệ thống auto (sai MK 7 lần) hoặc Admin thủ công
}

/** Số lần nhập sai mật khẩu tối đa trước khi bị tự động khóa */
export const MAX_FAILED_LOGIN_ATTEMPTS = 7;

@Schema({ timestamps: true, collection: 'accounts' })
export class Account {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  declare email: string;

  @Prop({ type: String, required: true, select: false })
  declare password_hash: string;

  @Prop({ type: String, enum: Role, required: true })
  declare role: Role;

  // Liên kết 1-1 với Employee
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  declare employee_id: Types.ObjectId | null;

  // Phòng ban account thuộc về — chỉ manager và hr mới có trường này
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  declare department_id: Types.ObjectId | null;

  /**
   * Trạng thái tài khoản:
   * - INACTIVE: mới tạo, chưa Admin kích hoạt (hệ thống tự set)
   * - ACTIVE:   Admin kích hoạt thủ công
   * - LOCKED:   sai MK 7 lần (hệ thống auto) hoặc Admin lock thủ công
   *
   * Admin chỉ được set ACTIVE hoặc LOCKED — không được set lại INACTIVE.
   */
  @Prop({ type: String, enum: AccountStatus, default: AccountStatus.INACTIVE })
  declare status: AccountStatus;

  /**
   * Đếm số lần nhập sai mật khẩu liên tiếp.
   * Reset về 0 khi đăng nhập thành công hoặc Admin kích hoạt/mở khóa.
   * Khi đạt MAX_FAILED_LOGIN_ATTEMPTS (7), hệ thống tự chuyển status → LOCKED.
   */
  @Prop({ type: Number, default: 0 })
  declare failed_login_attempts: number;

  /** Bắt buộc đổi mật khẩu khi đăng nhập lần đầu (tài khoản tự sinh) */
  @Prop({ type: Boolean, default: false })
  declare is_first_login: boolean;

  // Refresh token hash để revoke khi logout
  @Prop({ type: String, default: null, select: false })
  declare refresh_token_hash: string | null;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

AccountSchema.index({ role: 1 });
AccountSchema.index({ department_id: 1 });
AccountSchema.index({ employee_id: 1 });
AccountSchema.index({ status: 1 });

AccountSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Partial<Account>).password_hash;
    delete (ret as Partial<Account>).refresh_token_hash;
    return ret;
  },
});
