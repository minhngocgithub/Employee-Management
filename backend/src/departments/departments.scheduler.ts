import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schema/department.schema';

@Injectable()
export class DepartmentsScheduler {
  private readonly logger = new Logger(DepartmentsScheduler.name);

  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  /**
   * Chạy mỗi ngày lúc 00:00.
   * Clear acting_manager_id + acting_until khi acting_until < hôm nay.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearExpiredActingManagers(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.departmentModel.updateMany(
      {
        acting_manager_id: { $ne: null },
        acting_until: { $lt: today },
      },
      {
        $set: {
          acting_manager_id: null,
          acting_until: null,
        },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(
        `Cleared ${result.modifiedCount} expired acting manager(s)`,
      );
    }
  }
}
