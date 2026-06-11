import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LoginHistory,
  LoginHistoryDocument,
  LoginAction,
} from './schema/login-history.schema';

interface CreateLoginLogParams {
  account_id: Types.ObjectId;
  action: LoginAction;
  ip_address?: string | null;
  user_agent?: string | null;
}

@Injectable()
export class LoginHistoryService {
  constructor(
    @InjectModel(LoginHistory.name)
    private readonly loginHistoryModel: Model<LoginHistoryDocument>,
  ) {}

  async createLog(params: CreateLoginLogParams): Promise<void> {
    await this.loginHistoryModel.create({
      account_id: params.account_id,
      action: params.action,
      ip_address: params.ip_address ?? null,
      user_agent: params.user_agent ?? null,
    });
  }
}
