import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveStatus,
} from './schema/leave-request.schema';

@Injectable()
export class LeaveRequestsScheduler {
  private readonly logger = new Logger(LeaveRequestsScheduler.name);

  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Chạy mỗi ngày lúc 00:00.
   * Tự động reject các đơn PENDING quá N ngày kể từ lúc tạo.
   * N lấy từ env: LEAVE_REQUEST_AUTO_REJECT_DAYS (default 3)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoRejectExpiredRequests(): Promise<void> {
    const days = this.configService.get<number>(
      'LEAVE_REQUEST_AUTO_REJECT_DAYS',
      3,
    );

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.leaveRequestModel.updateMany(
      {
        status: LeaveStatus.PENDING,
        createdAt: { $lte: cutoff },
      },
      {
        $set: {
          status: LeaveStatus.REJECTED,
          rejection_reason: `Tự động từ chối do không được duyệt sau ${days} ngày`,
          reviewed_at: new Date(),
          reviewed_by: null, // null = hệ thống tự reject
        },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(
        `Auto-rejected ${result.modifiedCount} đơn nghỉ phép quá hạn (>${days} ngày)`,
      );
    }
  }
}
