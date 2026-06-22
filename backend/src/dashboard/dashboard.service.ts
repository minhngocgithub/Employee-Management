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
  working: number; // Đi làm
  retired: number; // Nghỉ hưu
  resigned: number; // Nghỉ việc
  pending: number; // Chưa xác định (status = null, chờ HR cập nhật)
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
  working_employees: number; // Đi làm
  retired_employees: number; // Nghỉ hưu
  resigned_employees: number; // Nghỉ việc
  pending_employees: number; // Chưa xác định (status = null)
  total_departments: number;
  headcount_by_department: HeadcountByDepartment[];
  leave_stats_this_month: LeaveStats;
  leave_stats_all_time: LeaveStats;
}

export interface ManagerDashboardStats {
  department_id: string;
  total_employees: number;
  working_employees: number;
  leave_stats_this_month: LeaveStats;
  pending_reviews: number;
}

// ─── Aggregate result types ───────────────────────────────────────────────────

type HeadcountAggResult = {
  _id: Types.ObjectId;
  total: number;
  working: number;
  retired: number;
  resigned: number;
  pending: number;
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
      workingEmployees,
      retiredEmployees,
      resignedEmployees,
      pendingEmployees,
      totalDepartments,
      headcountRaw,
      leaveStatsMonth,
      leaveStatsAll,
    ] = await Promise.all([
      this.employeeModel.countDocuments(),
      this.employeeModel.countDocuments({ status: EmployeeStatus.WORKING }),
      this.employeeModel.countDocuments({ status: EmployeeStatus.RETIRED }),
      this.employeeModel.countDocuments({ status: EmployeeStatus.RESIGNED }),
      this.employeeModel.countDocuments({ status: null }), // Chưa xác định
      this.departmentModel.countDocuments({ is_active: true }),
      this.getHeadcountByDepartment(),
      this.getLeaveStats(this.getMonthRange()),
      this.getLeaveStats(),
    ]);

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
        working: h.working,
        retired: h.retired,
        resigned: h.resigned,
        pending: h.pending,
      }),
    );

    return {
      total_employees: totalEmployees,
      working_employees: workingEmployees,
      retired_employees: retiredEmployees,
      resigned_employees: resignedEmployees,
      pending_employees: pendingEmployees,
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

    const employeeIds = await this.employeeModel
      .find({ department_id: deptObjectId })
      .select('_id')
      .lean<{ _id: Types.ObjectId }[]>();

    const ids = employeeIds.map((e) => e._id);

    const [totalEmployees, workingEmployees, leaveStatsMonth, pendingReviews] =
      await Promise.all([
        this.employeeModel.countDocuments({ department_id: deptObjectId }),
        this.employeeModel.countDocuments({
          department_id: deptObjectId,
          status: EmployeeStatus.WORKING,
        }),
        this.getLeaveStats(this.getMonthRange(), ids),
        this.leaveRequestModel.countDocuments({
          employee_id: { $in: ids },
          status: LeaveStatus.PENDING,
        }),
      ]);

    return {
      department_id: requester.department_id,
      total_employees: totalEmployees,
      working_employees: workingEmployees,
      leave_stats_this_month: leaveStatsMonth,
      pending_reviews: pendingReviews,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Aggregate số lượng nhân viên theo từng phòng ban,
   * phân loại đầy đủ theo 3 trạng thái + null (pending).
   */
  private async getHeadcountByDepartment(): Promise<HeadcountAggResult[]> {
    return this.employeeModel.aggregate<HeadcountAggResult>([
      {
        $group: {
          _id: '$department_id',
          total: { $sum: 1 },
          working: {
            $sum: {
              $cond: [{ $eq: ['$status', EmployeeStatus.WORKING] }, 1, 0],
            },
          },
          retired: {
            $sum: {
              $cond: [{ $eq: ['$status', EmployeeStatus.RETIRED] }, 1, 0],
            },
          },
          resigned: {
            $sum: {
              $cond: [{ $eq: ['$status', EmployeeStatus.RESIGNED] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', null] }, 1, 0],
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

    const statusMap = new Map(statusCounts.map((s) => [s._id, s.count]));

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

  private getMonthRange(): { $gte: Date; $lte: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { $gte: start, $lte: end };
  }
}
