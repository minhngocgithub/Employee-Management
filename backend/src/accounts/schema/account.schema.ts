import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountDocument = Account & Document;

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  HR = 'hr',
  EMPLOYEE = 'employee',
}
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

  // Lien ket 1-1 voi Employee
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  declare employee_id: Types.ObjectId | null;

  // Phong ban account thuoc ve, chi co manager va hr moi co truong nay
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  declare department_id: Types.ObjectId | null;

  @Prop({ type: Boolean, default: true })
  declare is_active: boolean;

  /** Bắt buộc đổi mật khẩu khi đăng nhập lần đầu (tài khoản tự sinh) */
  @Prop({ type: Boolean, default: false })
  declare is_first_login: boolean;

  // Refresh token hash de revoke khi logout
  @Prop({ type: String, default: null, select: false })
  declare refresh_token_hash: string | null;
}
export const AccountSchema = SchemaFactory.createForClass(Account);

AccountSchema.index({ role: 1 });
AccountSchema.index({ department_id: 1 });
AccountSchema.index({ employee_id: 1 });

AccountSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Partial<Account>).password_hash;
    delete (ret as Partial<Account>).refresh_token_hash;

    return ret;
  },
});
