import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Employee,
  EmployeeDocument,
  EmployeeStatus,
} from '../employees/schema/employee.schema';
import {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveStatus,
  LeaveType,
} from '../leave-requests/schema/leave-request.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schema/department.schema';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface HeadcountByDepartment {
  department_id: string;
  department_name: string;
  total: number;
  active: number;
  inactive: number;
  resigned: number;
}

export interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  by_type: Record<LeaveType, number>;
}

export interface AdminDashboardStats {
  total_employees: number;
  active_employees: number;
  resigned_employees: number;
  total_departments: number;
  headcount_by_department: HeadcountByDepartment[];
  leave_stats_this_month: LeaveStats;
  leave_stats_all_time: LeaveStats;
}

export interface ManagerDashboardStats {
  department_id: string;
  total_employees: number;
  active_employees: number;
  leave_stats_this_month: LeaveStats;
  pending_reviews: number;
}

// ─── Aggregate result types ───────────────────────────────────────────────────

type HeadcountAggResult = {
  _id: Types.ObjectId;
  total: number;
  active: number;
  inactive: number;
  resigned: number;
};

type LeaveCountAggResult = {
  _id: LeaveStatus;
  count: number;
};

type LeaveTypeAggResult = {
  _id: LeaveType;
  count: number;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  // ─── Admin stats ──────────────────────────────────────────────────────────

  async getAdminStats(): Promise<AdminDashboardStats> {
    const [
      totalEmployees,
      activeEmployees,
      resignedEmployees,
      totalDepartments,
      headcountRaw,
      leaveStatsMonth,
      leaveStatsAll,
    ] = await Promise.all([
      this.employeeModel.countDocuments(),
      this.employeeModel.countDocuments({ status: EmployeeStatus.ACTIVE }),
      this.employeeModel.countDocuments({ status: EmployeeStatus.RESIGNED }),
      this.departmentModel.countDocuments({ is_active: true }),
      this.getHeadcountByDepartment(),
      this.getLeaveStats(this.getMonthRange()),
      this.getLeaveStats(),
    ]);

    // Gắn tên department vào headcount
    const deptIds = headcountRaw.map((h) => h._id);
    const departments = await this.departmentModel
      .find({ _id: { $in: deptIds } })
      .select('_id name')
      .lean<{ _id: Types.ObjectId; name: string }[]>();

    const deptNameMap = new Map(
      departments.map((d) => [d._id.toString(), d.name]),
    );

    const headcount_by_department: HeadcountByDepartment[] = headcountRaw.map(
      (h) => ({
        department_id: h._id.toString(),
        department_name: deptNameMap.get(h._id.toString()) ?? 'Unknown',
        total: h.total,
        active: h.active,
        inactive: h.inactive,
        resigned: h.resigned,
      }),
    );

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      resigned_employees: resignedEmployees,
      total_departments: totalDepartments,
      headcount_by_department,
      leave_stats_this_month: leaveStatsMonth,
      leave_stats_all_time: leaveStatsAll,
    };
  }

  // ─── Manager stats ────────────────────────────────────────────────────────

  async getManagerStats(
    requester: AuthenticatedUser,
  ): Promise<ManagerDashboardStats> {
    const deptObjectId = new Types.ObjectId(requester.department_id);

    // Lấy danh sách employee trong dept
    const employeeIds = await this.employeeModel
      .find({ department_id: deptObjectId })
      .select('_id')
      .lean<{ _id: Types.ObjectId }[]>();

    const ids = employeeIds.map((e) => e._id);

    const [totalEmployees, activeEmployees, leaveStatsMonth, pendingReviews] =
      await Promise.all([
        this.employeeModel.countDocuments({ department_id: deptObjectId }),
        this.employeeModel.countDocuments({
          department_id: deptObjectId,
          status: EmployeeStatus.ACTIVE,
        }),
        this.getLeaveStats(this.getMonthRange(), ids),
        // Đếm số đơn đang chờ duyệt trong dept
        this.leaveRequestModel.countDocuments({
          employee_id: { $in: ids },
          status: LeaveStatus.PENDING,
        }),
      ]);

    return {
      department_id: requester.department_id,
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      leave_stats_this_month: leaveStatsMonth,
      pending_reviews: pendingReviews,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Aggregate số lượng nhân viên theo từng phòng ban,
   * phân loại theo status.
   */
  private async getHeadcountByDepartment(): Promise<HeadcountAggResult[]> {
    return this.employeeModel.aggregate<HeadcountAggResult>([
      {
        $group: {
          _id: '$department_id',
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', EmployeeStatus.ACTIVE] }, 1, 0],
            },
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$status', EmployeeStatus.INACTIVE] }, 1, 0],
            },
          },
          resigned: {
            $sum: {
              $cond: [{ $eq: ['$status', EmployeeStatus.RESIGNED] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  /**
   * Thống kê leave requests:
   * - Tổng theo status
   * - Tổng theo loại nghỉ phép
   *
   * @param dateRange - lọc theo khoảng thời gian (tháng hiện tại)
   * @param employeeIds - lọc theo danh sách employee (cho Manager)
   */
  private async getLeaveStats(
    dateRange?: { $gte: Date; $lte: Date },
    employeeIds?: Types.ObjectId[],
  ): Promise<LeaveStats> {
    const matchStage: Record<string, unknown> = {};

    if (dateRange) {
      matchStage['start_date'] = dateRange;
    }
    if (employeeIds && employeeIds.length > 0) {
      matchStage['employee_id'] = { $in: employeeIds };
    }

    const [statusCounts, typeCounts, total] = await Promise.all([
      this.leaveRequestModel.aggregate<LeaveCountAggResult>([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.leaveRequestModel.aggregate<LeaveTypeAggResult>([
        { $match: matchStage },
        { $group: { _id: '$leave_type', count: { $sum: 1 } } },
      ]),
      this.leaveRequestModel.countDocuments(matchStage),
    ]);

    // Map status counts
    const statusMap = new Map(statusCounts.map((s) => [s._id, s.count]));

    // Map type counts — khởi tạo tất cả LeaveType về 0
    const by_type = Object.values(LeaveType).reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<LeaveType, number>,
    );
    typeCounts.forEach((t) => {
      by_type[t._id] = t.count;
    });

    return {
      total,
      pending: statusMap.get(LeaveStatus.PENDING) ?? 0,
      approved: statusMap.get(LeaveStatus.APPROVED) ?? 0,
      rejected: statusMap.get(LeaveStatus.REJECTED) ?? 0,
      cancelled: statusMap.get(LeaveStatus.CANCELLED) ?? 0,
      by_type,
    };
  }

  /**
   * Trả về range từ đầu đến cuối tháng hiện tại.
   */
  private getMonthRange(): { $gte: Date; $lte: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { $gte: start, $lte: end };
  }
}
