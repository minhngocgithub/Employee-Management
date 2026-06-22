import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LeaveRequest } from './leave-request.schema';

export enum MaternityLeaveType {
  MATERNITY = 'maternity', // Thai sản chính
  PATERNITY = 'paternity', // Nghỉ chăm sóc con sau sinh (bố)
  CHILDCARE = 'childcare', // Nghỉ nuôi con nhỏ
}

/**
 * Nhóm 1 — Nghỉ phép & vắng mặt
 * ─────────────────────────────────
 * MATERNITY LEAVE — Nghỉ thai sản
 */
@Schema()
export class MaternityLeave extends LeaveRequest {
  @Prop({ type: String, enum: MaternityLeaveType, required: true })
  declare maternity_type: MaternityLeaveType;

  @Prop({ type: Date, required: true })
  declare start_date: Date;

  /** Dự kiến ngày trở lại */
  @Prop({ type: Date, required: true })
  declare expected_return_date: Date;

  /** Có yêu cầu giữ nguyên vị trí khi trở lại không */
  @Prop({ type: Boolean, default: true })
  declare request_position_hold: boolean;

  /** Tên người liên hệ khi nhân viên đang nghỉ */
  @Prop({ type: String, trim: true, default: null })
  declare emergency_contact_name: string | null;

  /** SĐT người liên hệ */
  @Prop({ type: String, trim: true, default: null })
  declare emergency_contact_phone: string | null;

  /**
   * Giấy tờ chứng minh (giấy khám thai, giấy sinh...).
   * File thực tế nằm trong attachment_urls của base schema.
   */
  @Prop({ type: Boolean, default: false })
  declare has_supporting_documents: boolean;
}

export const MaternityLeaveSchema =
  SchemaFactory.createForClass(MaternityLeave);
