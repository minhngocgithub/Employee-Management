import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type LoginHistoryDocument = LoginHistory & Document;

export enum LoginAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
}

@Schema({ timestamps: false, collection: 'login_history' })
export class LoginHistory {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  declare account_id: Types.ObjectId;

  @Prop({ type: String, enum: LoginAction, required: true })
  declare action: LoginAction;

  @Prop({ type: String, default: null })
  declare ip_address: string | null;

  @Prop({ type: String, default: null })
  declare user_agent: string | null;

  @Prop({ type: Date, default: () => new Date() })
  declare created_at: Date;
}

export const LoginHistorySchema = SchemaFactory.createForClass(LoginHistory);

LoginHistorySchema.index({ account_id: 1 });
LoginHistorySchema.index({ created_at: -1 });
LoginHistorySchema.index({ account_id: 1, created_at: -1 });
