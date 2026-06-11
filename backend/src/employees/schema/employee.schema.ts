import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmployeeDocument = Employee & Document;

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RESIGNED = 'resigned',
}

@Schema({ timestamps: true, collection: 'employees' })
export class Employee {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, unique: true })
  declare account_id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  declare full_name: string;

  /** Email cá nhân — dùng gửi thông báo tài khoản mới */
  @Prop({ type: String, required: true, lowercase: true, trim: true })
  declare personal_email: string;

  @Prop({ type: String, required: true, unique: true, uppercase: true })
  declare employee_code: string;

  @Prop({ type: String, trim: true, default: null })
  declare phone: string | null;

  @Prop({ type: String, default: null })
  declare avatar_url: string | null;

  @Prop({ type: Date, default: null })
  declare date_of_birth: Date | null;

  @Prop({ type: String, enum: Gender, default: null })
  declare gender: Gender | null;

  @Prop({ type: String, trim: true, default: null })
  declare address: string | null;

  @Prop({ type: String, trim: true, default: null })
  declare position: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  declare department_id: Types.ObjectId;

  @Prop({ type: Date, required: true })
  declare join_date: Date;

  @Prop({
    type: String,
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  declare status: EmployeeStatus;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

EmployeeSchema.index({ account_id: 1 }, { unique: true });
EmployeeSchema.index({ employee_code: 1 }, { unique: true });
EmployeeSchema.index({ personal_email: 1 });
EmployeeSchema.index({ department_id: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ full_name: 'text', employee_code: 'text' });
