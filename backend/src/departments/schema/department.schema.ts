import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DepartmentDocument = Department & Document;

export enum DepartmentLevel {
  COMPANY = 1,
  BOARD = 2,
  DEPARTMENT = 3,
}

@Schema({ timestamps: true, collection: 'departments' })
export class Department {
  @Prop({ type: String, required: true, trim: true })
  declare name: string;
  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  declare code: string;
  @Prop({ type: Number, required: true, enum: DepartmentLevel })
  declare level: DepartmentLevel;

  // null neu la cap "Cong ty"
  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  declare parent_id: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Account', default: null })
  declare manager_id: Types.ObjectId | null;

  /** Người được ủy quyền tạm thời khi manager vắng mặt — phải khác manager_id */
  @Prop({ type: Types.ObjectId, ref: 'Account', default: null })
  declare acting_manager_id: Types.ObjectId | null;

  /**
   * Ngày kết thúc ủy quyền — lấy từ end_date đơn nghỉ của manager (dept L3).
   * Null = không tự động hết hạn (L1/L2 hoặc Admin set thủ công).
   * Cronjob clear acting_manager_id khi acting_until < today.
   */
  @Prop({ type: Date, default: null })
  declare acting_until: Date | null;

  @Prop({ type: Boolean, default: true })
  declare is_active: boolean;
}
export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ level: 1 });
DepartmentSchema.index({ parent_id: 1 });
DepartmentSchema.index({ manager_id: 1 });
DepartmentSchema.index({ acting_manager_id: 1 });
DepartmentSchema.index({ acting_until: 1 }); // dùng cho cronjob clear expired
