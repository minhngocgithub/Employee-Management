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
import {
  AuditLog,
  AuditLogDocument,
  AuditAction,
  AuditEntity,
} from '../audit-logs/schema/audit-log.schema';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { PaginatedResult } from '../accounts/accounts.service';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeanLeaveRequest = {
  _id: Types.ObjectId;
  employee_id: Types.ObjectId;
  leave_type: LeaveType;
  status: LeaveStatus;
  reviewed_by: Types.ObjectId | null;
  rejection_reason: string | null;
  reviewed_at: Date | null;
  attachment_urls: string[];
  internal_note: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
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
  acting_manager_id: Types.ObjectId | null;
  level: number;
};

type LeanAccount = {
  _id: Types.ObjectId;
  employee_id: Types.ObjectId | null;
  department_id: Types.ObjectId;
  role: Role;
};

type LeanAuditLog = {
  _id: Types.ObjectId;
  actor_id: {
    _id: Types.ObjectId;
    email: string;
    employee_id: { full_name: string; employee_code: string } | null;
  };
  action: AuditAction;
  entity: AuditEntity;
  entity_id: Types.ObjectId;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: Date;
};

type LeaveRequestFilter = {
  employee_id?: Types.ObjectId | { $in: Types.ObjectId[] };
  status?: LeaveStatus;
  leave_type?: LeaveType;
  createdAt?: { $gte?: Date; $lte?: Date };
};

const TYPES_WITHOUT_DATE_RANGE = new Set<LeaveType>([
  LeaveType.LATE_EARLY,
  LeaveType.OVERTIME,
  LeaveType.SALARY_ADVANCE,
  LeaveType.RESIGNATION,
  LeaveType.ATTENDANCE_CORRECTION,
]);

const ROLES_CAN_CREATE = new Set<Role>([
  Role.EMPLOYEE,
  Role.MANAGER,
  Role.HR,
  Role.MANAGER_HR,
]);
const ROLES_CAN_REVIEW = new Set<Role>([
  Role.ADMIN,
  Role.MANAGER,
  Role.MANAGER_HR,
]);
const ROLES_CAN_NOTE = new Set<Role>([
  Role.ADMIN,
  Role.MANAGER,
  Role.HR,
  Role.MANAGER_HR,
]);

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
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateLeaveRequestDto,
    requester: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    if (!ROLES_CAN_CREATE.has(requester.role)) {
      throw new ForbiddenException('Bạn không có quyền tạo đơn');
    }
    const employee = await this.getEmployeeByAccountId(requester.id);
    const { internal_note, ...rest } = dto as CreateLeaveRequestDto & {
      internal_note?: string;
    };

    const leaveRequest = await this.leaveRequestModel.create({
      ...rest,
      employee_id: employee._id,
      status: LeaveStatus.PENDING,
      reviewed_by: null,
      rejection_reason: null,
      reviewed_at: null,
      attachment_urls: dto.attachment_urls ?? [],
      internal_note: ROLES_CAN_NOTE.has(requester.role)
        ? (internal_note ?? null)
        : null,
    });

    await this.writeAuditLog({
      actor_id: new Types.ObjectId(requester.id),
      action: AuditAction.CREATE,
      entity_id: leaveRequest._id,
      after_data: {
        leave_type: leaveRequest.leave_type,
        status: leaveRequest.status,
      },
    });

    return leaveRequest.toObject() as unknown as LeanLeaveRequest;
  }

  // ─── FindAll ──────────────────────────────────────────────────────────────

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

    if (requester.role === Role.EMPLOYEE) {
      const employee = await this.getEmployeeByAccountId(requester.id);
      filter.employee_id = employee._id;
    } else if (requester.role === Role.MANAGER) {
      const deptEmployees = await this.employeeModel
        .find({ department_id: new Types.ObjectId(requester.department_id) })
        .select('_id')
        .lean<{ _id: Types.ObjectId }[]>();
      const employeeIds = deptEmployees.map((e) => e._id);

      if (employee_id) {
        if (!employeeIds.some((id) => id.toString() === employee_id))
          throw new ForbiddenException(
            'Bạn không có quyền xem đơn của nhân viên này',
          );
        filter.employee_id = new Types.ObjectId(employee_id);
      } else {
        filter.employee_id = { $in: employeeIds };
      }
    } else if (employee_id) {
      filter.employee_id = new Types.ObjectId(employee_id);
    }

    if (status) filter.status = status;
    if (leave_type) filter.leave_type = leave_type;
    if (from_date || to_date) {
      filter.createdAt = {};
      if (from_date) filter.createdAt.$gte = new Date(from_date);
      if (to_date) filter.createdAt.$lte = new Date(to_date);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.leaveRequestModel
        .find(filter)
        .populate('employee_id', 'full_name employee_code')
        .populate('reviewed_by', 'email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean<LeanLeaveRequest[]>(),
      this.leaveRequestModel.countDocuments(filter),
    ]);
    const sanitized =
      requester.role === Role.EMPLOYEE
        ? data.map((d) => ({ ...d, internal_note: null }))
        : data;
    return {
      data: sanitized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  // ─── FindById ─────────────────────────────────────────────────────────────

  async findById(
    id: string,
    requester: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    this.assertValidObjectId(id);

    const lr = await this.leaveRequestModel
      .findById(id)
      .populate('employee_id', 'full_name employee_code department_id')
      .populate('reviewed_by', 'email')
      .lean<LeanLeaveRequest>();

    if (!lr) throw new NotFoundException('Không tìm thấy đơn');
    await this.assertCanView(lr, requester);

    if (requester.role === Role.EMPLOYEE) {
      return { ...lr, internal_note: null };
    }
    return lr;
  }

  // ─── F02.9 — Lịch sử phê duyệt ───────────────────────────────────────────

  async getHistory(
    id: string,
    requester: AuthenticatedUser,
  ): Promise<LeanAuditLog[]> {
    this.assertValidObjectId(id);

    const lr = await this.leaveRequestModel
      .findById(id)
      .lean<LeanLeaveRequest>();
    if (!lr) throw new NotFoundException('Không tìm thấy đơn');
    await this.assertCanView(lr, requester);

    return this.auditLogModel
      .find({
        entity: AuditEntity.LEAVE_REQUEST,
        entity_id: new Types.ObjectId(id),
      })
      .populate({
        path: 'actor_id',
        select: 'email employee_id',
        populate: { path: 'employee_id', select: 'full_name employee_code' },
      })
      .sort({ created_at: 1 })
      .lean<LeanAuditLog[]>();
  }

  // ─── Review ───────────────────────────────────────────────────────────────

  async review(
    id: string,
    dto: ReviewLeaveRequestDto,
    reviewer: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    this.assertValidObjectId(id);

    if (!ROLES_CAN_REVIEW.has(reviewer.role))
      throw new ForbiddenException('Bạn không có quyền duyệt đơn');

    const lr = await this.leaveRequestModel.findById(id);
    if (!lr) throw new NotFoundException('Không tìm thấy đơn');

    if (lr.status !== LeaveStatus.PENDING)
      throw new BadRequestException(
        'Chỉ có thể duyệt đơn đang ở trạng thái chờ',
      );

    await this.assertCanReview(lr.employee_id.toString(), reviewer);

    if (dto.status === LeaveStatus.REJECTED && !dto.rejection_reason?.trim())
      throw new BadRequestException('Phải cung cấp lý do khi từ chối');

    const before_data = {
      status: lr.status,
      reviewed_by: lr.reviewed_by,
      reviewed_at: lr.reviewed_at,
      rejection_reason: lr.rejection_reason,
    };

    lr.status = dto.status;
    lr.reviewed_by = new Types.ObjectId(reviewer.id);
    lr.reviewed_at = new Date();
    lr.rejection_reason =
      dto.status === LeaveStatus.REJECTED
        ? (dto.rejection_reason?.trim() ?? null)
        : null;
    if (dto.internal_note !== undefined)
      lr.internal_note = dto.internal_note?.trim() ?? null;

    await lr.save();

    await this.writeAuditLog({
      actor_id: new Types.ObjectId(reviewer.id),
      action: AuditAction.REVIEW,
      entity_id: lr._id,
      before_data,
      after_data: {
        status: lr.status,
        reviewed_by: lr.reviewed_by,
        reviewed_at: lr.reviewed_at,
        rejection_reason: lr.rejection_reason,
        internal_note: lr.internal_note,
      },
    });

    return lr.toObject() as unknown as LeanLeaveRequest;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateLeaveRequestDto,
    user: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    this.assertValidObjectId(id);

    const request = await this.leaveRequestModel
      .findById(id)
      .lean<LeanLeaveRequest>();
    if (!request) throw new NotFoundException('Đơn không tồn tại');
    if (request.status !== LeaveStatus.PENDING)
      throw new BadRequestException(
        'Chỉ có thể chỉnh sửa đơn ở trạng thái PENDING',
      );

    const employee = await this.getEmployeeByAccountId(user.id);
    if (request.employee_id.toString() !== employee._id.toString())
      throw new ForbiddenException('Bạn chỉ có thể chỉnh sửa đơn của mình');

    const { internal_note, attachment_urls, ...metadataFields } =
      dto as UpdateLeaveRequestDto & {
        internal_note?: string;
        attachment_urls?: string[];
      };

    if (
      !TYPES_WITHOUT_DATE_RANGE.has(request.leave_type) &&
      (metadataFields.start_date || metadataFields.end_date)
    ) {
      const startValue =
        (metadataFields.start_date as string | Date | undefined) ??
        (request.start_date as string | Date | undefined);

      const endValue =
        (metadataFields.end_date as string | Date | undefined) ??
        (request.end_date as string | Date | undefined);

      if (!startValue || !endValue) {
        throw new BadRequestException('Thiếu start_date hoặc end_date');
      }

      const startDate = new Date(startValue);
      const endDate = new Date(endValue);

      if (startDate > endDate)
        throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');

      const overlap = await this.leaveRequestModel.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        employee_id: request.employee_id,
        leave_type: { $in: this.getTypesWithDateRange() },
        status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        start_date: { $lte: endDate },
        end_date: { $gte: startDate },
      });
      if (overlap)
        throw new BadRequestException(
          'Đã có đơn nghỉ phép trong khoảng thời gian này',
        );
    }

    const updateData: Record<string, unknown> = { ...metadataFields };
    if (attachment_urls !== undefined)
      updateData.attachment_urls = attachment_urls;
    if (internal_note !== undefined && ROLES_CAN_NOTE.has(user.role))
      updateData.internal_note = internal_note?.trim() ?? null;

    const updated = await this.leaveRequestModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .lean<LeanLeaveRequest>();
    if (!updated) throw new NotFoundException('Đơn không tồn tại');

    await this.writeAuditLog({
      actor_id: new Types.ObjectId(user.id),
      action: AuditAction.UPDATE,
      entity_id: new Types.ObjectId(id),
      before_data: request,
      after_data: updateData,
    });

    return updated;
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────

  async cancel(
    id: string,
    requester: AuthenticatedUser,
  ): Promise<LeanLeaveRequest> {
    this.assertValidObjectId(id);

    const lr = await this.leaveRequestModel.findById(id);
    if (!lr) throw new NotFoundException('Không tìm thấy đơn');
    if (lr.status !== LeaveStatus.PENDING)
      throw new BadRequestException('Chỉ có thể hủy đơn đang ở trạng thái chờ');

    const employee = await this.getEmployeeByAccountId(requester.id);
    const isOwner = lr.employee_id.toString() === employee._id.toString();

    if (!isOwner && requester.role !== Role.ADMIN)
      throw new ForbiddenException('Bạn không có quyền hủy đơn này');

    const before_data = { status: lr.status };
    lr.status = LeaveStatus.CANCELLED;
    await lr.save();

    await this.writeAuditLog({
      actor_id: new Types.ObjectId(requester.id),
      action: AuditAction.REVIEW,
      entity_id: lr._id,
      before_data,
      after_data: { status: LeaveStatus.CANCELLED },
    });

    return lr.toObject() as unknown as LeanLeaveRequest;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async delete(
    id: string,
    user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    this.assertValidObjectId(id);

    const request = await this.leaveRequestModel
      .findById(id)
      .lean<LeanLeaveRequest>();
    if (!request) throw new NotFoundException('Đơn không tồn tại');
    if (request.status !== LeaveStatus.PENDING)
      throw new BadRequestException('Chỉ có thể xóa đơn ở trạng thái PENDING');

    const employee = await this.getEmployeeByAccountId(user.id);
    if (request.employee_id.toString() !== employee._id.toString())
      throw new ForbiddenException('Bạn chỉ có thể xóa đơn của mình');

    await this.leaveRequestModel.findByIdAndDelete(id);

    await this.writeAuditLog({
      actor_id: new Types.ObjectId(user.id),
      action: AuditAction.DELETE,
      entity_id: new Types.ObjectId(id),
      before_data: { leave_type: request.leave_type, status: request.status },
    });

    return { message: 'Xóa đơn thành công' };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async assertCanReview(
    employeeId: string,
    reviewer: AuthenticatedUser,
  ): Promise<void> {
    if (reviewer.role === Role.ADMIN || reviewer.role === Role.MANAGER_HR)
      return;
    if (!ROLES_CAN_REVIEW.has(reviewer.role))
      throw new ForbiddenException(
        'Chỉ Manager hoặc Admin mới có thể duyệt đơn',
      );

    const employee = await this.employeeModel
      .findById(employeeId)
      .select('department_id account_id')
      .lean<LeanEmployee>();
    if (!employee) throw new NotFoundException('Không tìm thấy nhân viên');

    const employeeAccount = await this.accountModel
      .findOne({ _id: employee.account_id })
      .select('role')
      .lean<LeanAccount>();

    const targetDeptId =
      employeeAccount?.role === Role.MANAGER
        ? await this.getParentDeptId(employee.department_id.toString())
        : employee.department_id;

    if (!targetDeptId)
      throw new BadRequestException(
        'Không tìm thấy manager phù hợp để duyệt đơn',
      );

    const targetDept = await this.departmentModel
      .findById(targetDeptId)
      .select('manager_id acting_manager_id')
      .lean<LeanDepartment>();

    if (!targetDept?.manager_id && !targetDept?.acting_manager_id)
      throw new BadRequestException(
        'Phòng ban chưa có manager hoặc người được ủy quyền',
      );

    const isManager = targetDept.manager_id?.toString() === reviewer.id;
    const isActingManager =
      targetDept.acting_manager_id?.toString() === reviewer.id;

    if (!isManager && !isActingManager)
      throw new ForbiddenException(
        'Bạn không phải manager hoặc người được ủy quyền phụ trách phòng ban này',
      );
  }

  private async assertCanView(
    lr: LeanLeaveRequest,
    requester: AuthenticatedUser,
  ): Promise<void> {
    if ([Role.ADMIN, Role.HR, Role.MANAGER_HR].includes(requester.role)) return;

    if (requester.role === Role.EMPLOYEE) {
      const employee = await this.getEmployeeByAccountId(requester.id);
      if (lr.employee_id.toString() !== employee._id.toString())
        throw new ForbiddenException('Bạn không có quyền xem đơn này');
      return;
    }

    if (requester.role === Role.MANAGER) {
      const employee = await this.employeeModel
        .findById(lr.employee_id)
        .select('department_id')
        .lean<{ department_id: Types.ObjectId }>();
      if (
        !employee ||
        employee.department_id.toString() !== requester.department_id
      )
        throw new ForbiddenException('Bạn không có quyền xem đơn này');
    }
  }

  private async getEmployeeByAccountId(
    accountId: string,
  ): Promise<LeanEmployee> {
    const employee = await this.employeeModel
      .findOne({ account_id: new Types.ObjectId(accountId) })
      .select('_id department_id account_id full_name')
      .lean<LeanEmployee>();
    if (!employee)
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    return employee;
  }

  private async checkOverlapping(
    employeeId: Types.ObjectId,
    start: Date,
    end: Date,
  ): Promise<void> {
    const overlap = await this.leaveRequestModel.findOne({
      employee_id: employeeId,
      leave_type: { $in: this.getTypesWithDateRange() },
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      start_date: { $lte: end },
      end_date: { $gte: start },
    });
    if (overlap)
      throw new BadRequestException(
        'Đã có đơn nghỉ phép trong khoảng thời gian này',
      );
  }

  private getTypesWithDateRange(): LeaveType[] {
    return Object.values(LeaveType).filter(
      (t) => !TYPES_WITHOUT_DATE_RANGE.has(t),
    );
  }

  private async getParentDeptId(
    deptId: string,
  ): Promise<Types.ObjectId | null> {
    const dept = await this.departmentModel
      .findById(deptId)
      .select('parent_id')
      .lean<LeanDepartment>();
    return dept?.parent_id ?? null;
  }

  private async writeAuditLog(params: {
    actor_id: Types.ObjectId;
    action: AuditAction;
    entity_id: Types.ObjectId;
    before_data?: Record<string, unknown> | null;
    after_data?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      await this.auditLogModel.create({
        actor_id: params.actor_id,
        action: params.action,
        entity: AuditEntity.LEAVE_REQUEST,
        entity_id: params.entity_id,
        before_data: params.before_data ?? null,
        after_data: params.after_data ?? null,
        ip_address: null,
      });
    } catch {
      /* Audit log failure không block nghiệp vụ chính */
    }
  }

  private assertValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID không hợp lệ');
  }
}
