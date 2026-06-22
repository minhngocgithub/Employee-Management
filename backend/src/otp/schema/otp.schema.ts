import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true, collection: 'otps' })
export class Otp {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  declare account_id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  })
  declare email: string;

  @Prop({
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6,
  })
  declare code: string;

  @Prop({
    type: String,
    enum: ['password_reset', 'email_verification', 'account_activation'],
    default: 'password_reset',
  })
  declare type: string;

  @Prop({
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 2 * 60 * 1000), // Thời gian hết hạn là 2 phút sau
    expires: 0, // Sửa tại đây: Chỉ định TTL index xóa ngay lập tức (0 giây) khi đạt mốc expires_at
  })
  declare expires_at: Date;

  @Prop({ type: Boolean, default: false })
  declare is_used: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  declare used_at: Date | null;

  @Prop({ type: Number, default: 0 })
  declare attempt_count: number;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  declare created_at: Date;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  declare updated_at: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ account_id: 1, type: 1 });
OtpSchema.index({ email: 1, type: 1 });
OtpSchema.index({ code: 1 });
