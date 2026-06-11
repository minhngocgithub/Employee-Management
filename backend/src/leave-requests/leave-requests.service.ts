import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveStatus,
  LeaveType,
} from './schema/leave-request.schema';
import {
  Employee,
  EmployeeDocument,
} from '../employees/schema/employee.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schema/department.schema';
import {
  Account,
  AccountDocument,
  Role,
} from '../accounts/schema/account.schema';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { PaginatedResult } from '../accounts/accounts.service';

type LeanLeaveRequest = {
  _id: Types.ObjectId;
  employee_id: Types.ObjectId;
  leave_type: string;
  start_date: Date;
  end_date: Date;
  reason: string;
  status: LeaveStatus;
  reviewed_by: Types.ObjectId | null;
  rejection_reason: string | null;
  reviewed_at: Date | null;
};
type LeanEmployee = {
  _id: Types.ObjectId;
  account_id: Types.ObjectId;
  department_id: Types.ObjectId;
  full_name: string;
};
type LeanDepartment = {
  _id: Types.ObjectId;
  parent_id: Types.ObjectId | null;
  manager_id: Types.ObjectId | null;
  level: number;
};
type LeanAccount = {
  _id: Types.ObjectId;
  employee_id: Types.ObjectId | null;
  department_id: Types.ObjectId;
  role: Role;
};
type LeaveRequestFilter = {
  employee_id?: Types.ObjectId;
  status?: LeaveStatus;
  leave_type?: LeaveType;
  start_date?: { $gte: Date };
  end_date?: { $lte: Date };
};

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}
  async create(
    dto: CreateLeaveRequestDto,
    requester: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    // Chỉ Employee / Manager / HR được tạo đơn
    if (![Role.EMPLOYEE, Role.MANAGER, Role.HR].includes(requester.role)) {
      throw new ForbiddenException('Bạn không có quyền tạo đơn nghỉ phép');
    }
    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    if (start > end) {
      throw new BadRequestException(
        'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
      );
    }
    // Lấy employee của người tạo đơn
    const employee = await this.getEmployeeByAccountId(requester.id);
    // Kiểm tra không có đơn PENDING/APPROVED nào trùng ngày
    await this.checkOverlapping(employee._id, start, end);
    // Tạo đơn
    const leaveRequest = await this.leaveRequestModel.create({
      employee_id: employee._id,
      leave_type: dto.leave_type,
      start_date: start,
      end_date: end,
      reason: dto.reason.trim(),
      status: LeaveStatus.PENDING,
      reviewed_by: null,
      rejection_reason: null,
      reviewed_at: null,
    });
    return leaveRequest.toObject();
  }
  async findAll(
    query: QueryLeaveRequestDto,
    requester: AuthenticatedUser,
  ): Promise<PaginatedResult<LeanLeaveRequest>> {
    const {
      status,
      leave_type,
      employee_id,
      from_date,
      to_date,
      page = 1,
      limit = 20,
    } = query;
    const filter: LeaveRequestFilter = {};
    // Employee chỉ xem được đơn của mình, các role khác xem được tất cả (có filter thêm)
    if (requester.role === Role.EMPLOYEE) {
      const employee = await this.getEmployeeByAccountId(requester.id);
      filter.employee_id = employee._id;
    } else if (requester.role === Role.MANAGER) {
      // Manager chỉ xem được đơn của nhân viên trong department mình quản lý
      const deptEmployees = await this.employeeModel
        .find({ department_id: new Types.ObjectId(requester.department_id) })
        .select('_id')
        .lean<{ _id: Types.ObjectId }[]>();
      const employeeIds = deptEmployees.map((e) => e._id);
      // Nếu có filter employee_id thì phải nằm trong department của manager
      if (employee_id) {
        const isInDept = employeeIds.some(
          (id) => id.toString() === employee_id,
        );
        if (!isInDept) {
          throw new ForbiddenException(
            'Bạn không có quyền xem đơn của nhân viên này',
          );
        }
        filter.employee_id = new Types.ObjectId(employee_id);
      } else {
        (filter as Record<string, unknown>).employee_id = { $in: employeeIds };
      }
    } else if (employee_id) {
      filter.employee_id = new Types.ObjectId(employee_id);
    }
    if (status) filter.status = status;
    if (leave_type) filter.leave_type = leave_type;
    if (from_date) filter.start_date = { $gte: new Date(from_date) };
    if (to_date) filter.end_date = { $lte: new Date(to_date) };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.leaveRequestModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean<LeanLeaveRequest[]>(),
      this.leaveRequestModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async findById(
    id: string,
    requester: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    this.assertValidObjectId(id);

    const lr = await this.leaveRequestModel
      .findById(id)
      .lean<LeanLeaveRequest>();

    if (!lr) throw new NotFoundException('Không tìm thấy đơn nghỉ phép');

    await this.assertCanView(lr, requester);

    return lr;
  }
  // ─── Review (approve / reject) ────────────────────────────────────────────

  async review(
    id: string,
    dto: ReviewLeaveRequestDto,
    reviewer: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    this.assertValidObjectId(id);

    if (reviewer.role === Role.EMPLOYEE) {
      throw new ForbiddenException('Bạn không có quyền duyệt đơn');
    }

    const lr = await this.leaveRequestModel.findById(id);
    if (!lr) throw new NotFoundException('Không tìm thấy đơn nghỉ phép');

    if (lr.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể duyệt đơn đang ở trạng thái chờ',
      );
    }

    // Kiểm tra reviewer có quyền duyệt đơn này không
    await this.assertCanReview(lr.employee_id.toString(), reviewer);

    if (dto.status === LeaveStatus.REJECTED && !dto.rejection_reason?.trim()) {
      throw new BadRequestException('Phải cung cấp lý do khi từ chối');
    }

    lr.status = dto.status;
    lr.reviewed_by = new Types.ObjectId(reviewer.id);
    lr.reviewed_at = new Date();
    lr.rejection_reason =
      dto.status === LeaveStatus.REJECTED
        ? (dto.rejection_reason?.trim() ?? null)
        : null;

    await lr.save();
    return lr.toObject();
  }
  // ─── Cancel ───────────────────────────────────────────────────────────────

  async cancel(
    id: string,
    requester: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    this.assertValidObjectId(id);

    const lr = await this.leaveRequestModel.findById(id);
    if (!lr) throw new NotFoundException('Không tìm thấy đơn nghỉ phép');

    if (lr.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy đơn đang ở trạng thái chờ');
    }

    // Chỉ người tạo đơn hoặc Admin mới được hủy
    const employee = await this.getEmployeeByAccountId(requester.id);
    const isOwner = lr.employee_id.toString() === employee._id.toString();
    const isAdmin = requester.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn này');
    }

    lr.status = LeaveStatus.CANCELLED;
    await lr.save();

    return lr.toObject();
  }
  // ─── Private: Authorization helpers ──────────────────────────────────────

  /**
   * Kiểm tra reviewer có được phép duyệt đơn của employee này không.
   *
   * Luồng:
   * - Employee → Manager của department employee
   * - Manager  → Manager của department cấp trên
   * - HR       → Manager của department HR thuộc về
   * - Admin    → Được phép duyệt tất cả
   */
  private async assertCanReview(
    employeeId: string,
    reviewer: AuthenticatedUser,
  ): Promise<void> {
    if (reviewer.role === Role.ADMIN) return;

    if (reviewer.role !== Role.MANAGER) {
      throw new ForbiddenException(
        'Chỉ Manager hoặc Admin mới có thể duyệt đơn',
      );
    }

    // Lấy thông tin employee tạo đơn
    const employee = await this.employeeModel
      .findById(employeeId)
      .select('department_id account_id')
      .lean<LeanEmployee>();

    if (!employee) throw new NotFoundException('Không tìm thấy nhân viên');

    // Lấy account của employee để biết role
    const employeeAccount = await this.accountModel
      .findOne({ _id: { $eq: employee.account_id } })
      .select('role department_id')
      .lean<LeanAccount>();

    const targetDeptId =
      employeeAccount?.role === Role.MANAGER
        ? // Nếu người tạo đơn là Manager → reviewer phải là manager cấp trên
          await this.getParentDeptManagerDeptId(
            employee.department_id.toString(),
          )
        : // Còn lại (Employee, HR) → reviewer phải là manager của department đó
          employee.department_id;

    if (!targetDeptId) {
      throw new BadRequestException(
        'Không tìm thấy manager phù hợp để duyệt đơn',
      );
    }

    // Reviewer phải là manager của targetDept
    const targetDept = await this.departmentModel
      .findById(targetDeptId)
      .select('manager_id')
      .lean<LeanDepartment>();

    if (!targetDept?.manager_id) {
      throw new BadRequestException(
        'Phòng ban chưa có manager, không thể duyệt đơn',
      );
    }

    if (targetDept.manager_id.toString() !== reviewer.id) {
      throw new ForbiddenException(
        'Bạn không phải manager phụ trách phòng ban này',
      );
    }
  }
  /**
   * Lấy department_id của phòng ban cha (dùng cho đơn của Manager).
   * Manager cấp 3 → tìm dept cấp 2 (BOARD) → lấy manager_id của dept đó.
   */
  private async getParentDeptManagerDeptId(
    deptId: string,
  ): Promise<Types.ObjectId | null> {
    const dept = await this.departmentModel
      .findById(deptId)
      .select('parent_id')
      .lean<LeanDepartment>();

    return dept?.parent_id ?? null;
  }
  private async assertCanView(
    lr: LeanLeaveRequest,
    requester: AuthenticatedUser,
  ): Promise<void> {
    if (requester.role === Role.ADMIN || requester.role === Role.HR) return;

    if (requester.role === Role.EMPLOYEE) {
      const employee = await this.getEmployeeByAccountId(requester.id);
      if (lr.employee_id.toString() !== employee._id.toString()) {
        throw new ForbiddenException('Bạn không có quyền xem đơn này');
      }
      return;
    }

    // MANAGER: chỉ xem đơn của nhân viên trong dept mình
    if (requester.role === Role.MANAGER) {
      const employee = await this.employeeModel
        .findById(lr.employee_id)
        .select('department_id')
        .lean<{ department_id: Types.ObjectId }>();

      if (
        !employee ||
        employee.department_id.toString() !== requester.department_id
      ) {
        throw new ForbiddenException('Bạn không có quyền xem đơn này');
      }
    }
  }
  private async getEmployeeByAccountId(
    accountId: string,
  ): Promise<LeanEmployee> {
    const employee = await this.employeeModel
      .findOne({ account_id: new Types.ObjectId(accountId) })
      .select('_id department_id account_id full_name')
      .lean<LeanEmployee>();

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    return employee;
  }
  private async checkOverlapping(
    employeeId: Types.ObjectId,
    start: Date,
    end: Date,
  ): Promise<void> {
    const overlap = await this.leaveRequestModel.findOne({
      employee_id: employeeId,
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      // Kiểm tra overlap: đơn mới nằm trong hoặc giao với đơn cũ
      start_date: { $lte: end },
      end_date: { $gte: start },
    });

    if (overlap) {
      throw new BadRequestException(
        'Đã có đơn nghỉ phép trong khoảng thời gian này',
      );
    }
  }
  private assertValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }
}
