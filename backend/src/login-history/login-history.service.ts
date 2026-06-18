import { Injectable, ForbiddenException } from '@nestjs/common';
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

interface GetLoginHistoryParams {
  page: number;
  limit: number;
  account_id?: string;
  current_user_id: string;
  current_user_role: string;
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

  /**
   * Get login history with pagination
   * Admin: can see all
   * Others: can only see their own
   */
  async getLoginHistory(params: GetLoginHistoryParams): Promise<{
    data: LoginHistoryDocument[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const skip = (params.page - 1) * params.limit;

    // Build query based on role
    const query: Record<string, any> = {};

    if (params.account_id && params.current_user_role === 'admin') {
      // Chỉ filter khi là valid ObjectId, bỏ qua nếu đang nhập dở
      if (Types.ObjectId.isValid(params.account_id)) {
        query.account_id = new Types.ObjectId(params.account_id);
      }
    } else if (params.account_id && params.current_user_role !== 'admin') {
      if (params.account_id !== params.current_user_id) {
        throw new ForbiddenException(
          'You can only view your own login history',
        );
      }
      if (Types.ObjectId.isValid(params.account_id)) {
        query.account_id = new Types.ObjectId(params.account_id);
      }
    } else if (!params.account_id && params.current_user_role !== 'admin') {
      // Non-admin: only their own by default
      if (Types.ObjectId.isValid(params.current_user_id)) {
        query.account_id = new Types.ObjectId(params.current_user_id);
      }
    }

    const [data, total] = await Promise.all([
      this.loginHistoryModel
        .find(query)
        .populate('account_id', 'email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(params.limit)
        .lean(),
      this.loginHistoryModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    };
  }

  /**
   * Get login statistics by day (admin only)
   */
  async getLoginStats(days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.loginHistoryModel.aggregate([
      {
        $match: {
          created_at: { $gte: startDate },
          action: LoginAction.LOGIN,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return stats;
  }

  /**
   * Clean up old login history records (can be called via cron)
   */
  async cleanupOldLogs(
    daysToKeep: number = 90,
  ): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.loginHistoryModel.deleteMany({
      created_at: { $lt: cutoffDate },
    });

    return { deletedCount: result.deletedCount };
  }
}
