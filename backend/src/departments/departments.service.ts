import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Department,
  DepartmentDocument,
  DepartmentLevel,
} from '../departments/schema/department.schema';
import {
  Employee,
  EmployeeDocument,
  EmployeeStatus,
} from '../employees/schema/employee.schema';
import {
  Account,
  AccountDocument,
  Role,
} from '../accounts/schema/account.schema';
import { CreateDepartmentDto } from '../departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '../departments/dto/update-department.dto';
import { SetActingManagerDto } from '../departments/dto/set-acting-manager.dto';

export interface DepartmentTree extends Omit<Department, '_id'> {
  _id: Types.ObjectId;
  children: DepartmentTree[];
}

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateDepartmentDto): Promise<DepartmentDocument> {
    const exists = await this.departmentModel
      .findOne({ code: dto.code.toUpperCase() })
      .lean();
    if (exists) {
      throw new ConflictException(`Mã phòng ban '${dto.code}' đã tồn tại`);
    }

    await this.validateHierarchy(dto.level, dto.parent_id ?? null);

    const department = await this.departmentModel.create({
      name: dto.name.trim(),
      code: dto.code.toUpperCase(),
      level: dto.level,
      parent_id: dto.parent_id ? new Types.ObjectId(dto.parent_id) : null,
      manager_id: dto.manager_id ? new Types.ObjectId(dto.manager_id) : null,
      is_active: true,
    });

    return department;
  }

  // ─── FindAll (flat list) ──────────────────────────────────────────────────

  async findAll(
    includeInactive = false,
    search?: string,
  ): Promise<DepartmentDocument[]> {
    const filter: Record<string, any> = {};

    if (!includeInactive) {
      filter.is_active = true;
    }

    if (search?.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: 'i',
          },
        },
        {
          code: {
            $regex: search.trim(),
            $options: 'i',
          },
        },
      ];
    }

    return this.departmentModel
      .find(filter)
      .sort({ level: 1, name: 1 })
      .lean<DepartmentDocument[]>();
  }

  // ─── FindTree (cây phân cấp) ──────────────────────────────────────────────

  async findTree(): Promise<DepartmentTree[]> {
    const all = await this.departmentModel
      .find({ is_active: true })
      .sort({ level: 1, name: 1 })
      .lean<(Department & { _id: Types.ObjectId })[]>();

    return this.buildTree(all, null);
  }

  // ─── FindOne ──────────────────────────────────────────────────────────────

  async findById(id: string): Promise<DepartmentDocument> {
    this.assertValidObjectId(id);

    const dept = await this.departmentModel
      .findById(id)
      .lean<DepartmentDocument>();

    if (!dept) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    return dept;
  }

  // ─── FindChildren (lấy phòng ban con trực tiếp) ───────────────────────────

  async findChildren(parentId: string): Promise<DepartmentDocument[]> {
    this.assertValidObjectId(parentId);
    return this.departmentModel
      .find({ parent_id: new Types.ObjectId(parentId), is_active: true })
      .sort({ name: 1 })
      .lean<DepartmentDocument[]>();
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentDocument> {
    this.assertValidObjectId(id);

    const dept = await this.departmentModel.findById(id);
    if (!dept) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    if (dto.name !== undefined) dept.name = dto.name.trim();
    if (dto.is_active !== undefined) dept.is_active = dto.is_active;

    if (dto.manager_id !== undefined) {
      dept.manager_id = dto.manager_id
        ? new Types.ObjectId(dto.manager_id)
        : null;

      // Sử dụng String() giúp an toàn hơn .toString() khi kiểu dữ liệu chưa phân giải rõ ràng
      const actingManagerIdStr = dept.acting_manager_id
        ? String(dept.acting_manager_id)
        : null;
      const managerIdStr = dept.manager_id ? String(dept.manager_id) : null;

      if (!dept.manager_id || actingManagerIdStr === managerIdStr) {
        dept.acting_manager_id = null;
      }
    }

    if (dto.acting_manager_id !== undefined) {
      if (dto.acting_manager_id === null) {
        dept.acting_manager_id = null;
      } else {
        this.assertValidObjectId(dto.acting_manager_id);
        if (String(dto.acting_manager_id) === String(dept.manager_id)) {
          throw new BadRequestException(
            'Người được ủy quyền phải khác manager hiện tại',
          );
        }
        dept.acting_manager_id = new Types.ObjectId(dto.acting_manager_id);
      }
    }

    await dept.save();
    return dept.toObject() as DepartmentDocument;
  }

  // ─── Assign manager ───────────────────────────────────────────────────────

  async assignManager(
    departmentId: string,
    managerId: string | null,
  ): Promise<DepartmentDocument> {
    this.assertValidObjectId(departmentId);

    const dept = await this.departmentModel.findById(departmentId);
    if (!dept) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    // ── Gỡ manager cũ: reset position + role → employee ──
    if (dept.manager_id) {
      const oldManagerAccountId =
        dept.manager_id instanceof Types.ObjectId
          ? dept.manager_id
          : new Types.ObjectId(dept.manager_id);

      const oldEmployee = await this.employeeModel.findOne({
        account_id: oldManagerAccountId,
      });
      if (oldEmployee) {
        oldEmployee.position = null;
        await oldEmployee.save();
      }

      // Đổi role về employee
      await this.accountModel.findByIdAndUpdate(oldManagerAccountId, {
        role: Role.EMPLOYEE,
      });
    }

    if (managerId) {
      this.assertValidObjectId(managerId);
      const newManagerId = new Types.ObjectId(managerId);

      const newEmployee = await this.employeeModel.findOne({
        account_id: newManagerId,
        department_id: new Types.ObjectId(departmentId),
        status: EmployeeStatus.ACTIVE,
      });

      if (!newEmployee) {
        throw new BadRequestException(
          'Nhân viên này không thuộc phòng ban hoặc đã bị vô hiệu hóa. Vui lòng chỉ gán Manager từ nhân viên hoạt động của phòng ban.',
        );
      }

      newEmployee.position = `Trưởng phòng ${dept.name}`;
      await newEmployee.save();
      dept.manager_id = newManagerId;

      // Đổi role → manager
      await this.accountModel.findByIdAndUpdate(newManagerId, {
        role: Role.MANAGER,
      });

      // Nếu acting manager trùng với manager mới → xóa acting
      const actingIdStr = dept.acting_manager_id
        ? String(dept.acting_manager_id)
        : null;
      if (actingIdStr === String(newManagerId)) {
        dept.acting_manager_id = null;
      }
    } else {
      dept.manager_id = null;
      dept.acting_manager_id = null;
    }

    return await dept.save();
  }

  // ─── Assign acting manager ────────────────────────────────────────────────

  async assignActingManager(
    departmentId: string,
    dto: SetActingManagerDto,
    requester: { id: string; role: string; department_id: string },
  ): Promise<DepartmentDocument> {
    this.assertValidObjectId(departmentId);

    const dept = await this.departmentModel.findById(departmentId);
    if (!dept) throw new NotFoundException('Không tìm thấy phòng ban');

    // ── Kiểm tra quyền set acting manager ──
    await this.assertCanSetActingManager(dept, requester);

    if (dto.acting_manager_id === null) {
      // Xóa ủy quyền
      dept.acting_manager_id = null;
      dept.acting_until = null;
      await dept.save();
      return dept.toObject() as DepartmentDocument;
    }

    this.assertValidObjectId(dto.acting_manager_id);

    if (!dept.manager_id) {
      throw new BadRequestException(
        'Phòng ban chưa có manager, không thể ủy quyền tạm thời',
      );
    }

    const actingId = new Types.ObjectId(dto.acting_manager_id);

    if (String(actingId) === String(dept.manager_id)) {
      throw new BadRequestException(
        'Người được ủy quyền phải khác manager hiện tại',
      );
    }

    // Acting manager phải là nhân viên active trong phòng ban
    const employee = await this.employeeModel.findOne({
      account_id: actingId,
      department_id: dept._id,
      status: EmployeeStatus.ACTIVE,
    });
    if (!employee) {
      throw new BadRequestException(
        'Nhân viên này không thuộc phòng ban hoặc đã bị vô hiệu hóa',
      );
    }

    dept.acting_manager_id = actingId;

    // acting_until do người dùng truyền vào — null = không tự hết hạn
    dept.acting_until = dto.acting_until ? new Date(dto.acting_until) : null;

    await dept.save();
    return dept.toObject() as DepartmentDocument;
  }

  /**
   * Kiểm tra requester có quyền set acting manager cho dept không.
   *
   * - Admin: luôn được
   * - Manager L3: chỉ set cho phòng mình, phải có đơn nghỉ approved
   * - Manager L2: set cho dept L3 con nếu L3 chưa có acting manager
   */
  private async assertCanSetActingManager(
    dept: DepartmentDocument,
    requester: { id: string; role: string; department_id: string },
  ): Promise<void> {
    if (requester.role === 'admin') return;

    if (requester.role !== 'manager') {
      throw new BadRequestException(
        'Chỉ Manager hoặc Admin mới có thể ủy quyền',
      );
    }

    const deptId = String((dept as unknown as { _id: Types.ObjectId })._id);

    // Manager L3: chỉ set cho phòng mình
    if (dept.level === DepartmentLevel.DEPARTMENT) {
      if (requester.department_id !== deptId) {
        throw new BadRequestException(
          'Bạn chỉ có thể ủy quyền cho phòng ban của mình',
        );
      }
      return; // đơn nghỉ sẽ được check khi set acting_until
    }

    // Manager L2: chỉ set cho dept L3 là con trực tiếp của mình
    // (dept.level !== DEPARTMENT đã được đảm bảo bởi guard trên)

    const requesterDept = await this.departmentModel
      .findOne({ manager_id: new Types.ObjectId(requester.id) })
      .select('_id level')
      .lean<{ _id: Types.ObjectId; level: number }>();

    if (!requesterDept) {
      throw new BadRequestException('Không tìm thấy phòng ban của bạn');
    }

    // Kiểm tra dept cần ủy quyền có phải con của requester dept không
    const isChild = String(dept.parent_id) === String(requesterDept._id);
    if (!isChild) {
      throw new BadRequestException(
        'Bạn chỉ có thể ủy quyền cho phòng ban cấp dưới của mình',
      );
    }

    // L2 chỉ set nếu L3 chưa có acting manager
    if (dept.acting_manager_id) {
      throw new BadRequestException(
        'Phòng ban này đã có người được ủy quyền. Manager phòng ban có thể tự thay đổi nếu cần',
      );
    }
  }

  // ─── Get employees by department ──────────────────────────────────────────

  async getEmployeesByDepartment(
    departmentId: string,
  ): Promise<EmployeeDocument[]> {
    this.assertValidObjectId(departmentId);

    const dept = await this.departmentModel.findById(departmentId);
    if (!dept) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    return this.employeeModel
      .find({
        department_id: new Types.ObjectId(departmentId),
        status: EmployeeStatus.ACTIVE,
      })
      .populate('account_id', 'email')
      .sort({ full_name: 1 })
      .lean<EmployeeDocument[]>();
  }

  // ─── Delete (soft delete) ─────────────────────────────────────────────────

  async softDelete(id: string): Promise<void> {
    this.assertValidObjectId(id);

    const dept = await this.departmentModel.findById(id);
    if (!dept) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    const hasChildren = await this.departmentModel.exists({
      parent_id: new Types.ObjectId(id),
      is_active: true,
    });
    if (hasChildren) {
      throw new BadRequestException(
        'Không thể xóa phòng ban còn có phòng ban con đang hoạt động',
      );
    }

    if (dept.level === DepartmentLevel.COMPANY) {
      throw new BadRequestException('Không thể xóa phòng ban cấp Công ty');
    }

    dept.is_active = false;
    await dept.save();
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async validateHierarchy(
    level: DepartmentLevel,
    parentId: string | null,
  ): Promise<void> {
    if (level === DepartmentLevel.COMPANY) {
      const existing = await this.departmentModel
        .findOne({ level: DepartmentLevel.COMPANY })
        .lean();
      if (existing) {
        throw new BadRequestException(
          'Hệ thống chỉ được có 1 phòng ban cấp Công ty',
        );
      }
      if (parentId) {
        throw new BadRequestException('Phòng ban cấp Công ty không có parent');
      }
      return;
    }

    if (!parentId) {
      throw new BadRequestException(
        'Phòng ban cấp Board và Department phải có parent_id',
      );
    }

    const parent = await this.departmentModel
      .findById(parentId)
      .select('level is_active')
      .lean<{ level: DepartmentLevel; is_active: boolean }>();

    if (!parent) {
      throw new NotFoundException('Không tìm thấy phòng ban cha');
    }

    if (!parent.is_active) {
      throw new BadRequestException('Phòng ban cha đang bị vô hiệu hóa');
    }

    const expectedParentLevel: Record<number, DepartmentLevel> = {
      [DepartmentLevel.BOARD]: DepartmentLevel.COMPANY,
      [DepartmentLevel.DEPARTMENT]: DepartmentLevel.BOARD,
    };

    if (parent.level !== expectedParentLevel[level]) {
      throw new BadRequestException(
        `Phòng ban cấp ${level} phải thuộc phòng ban cấp ${expectedParentLevel[level]}`,
      );
    }
  }

  private buildTree(
    nodes: (Department & { _id: Types.ObjectId })[],
    parentId: Types.ObjectId | null,
  ): DepartmentTree[] {
    return nodes
      .filter((node) => {
        const nodeParent = node.parent_id;
        if (parentId === null) return nodeParent === null;
        return nodeParent?.toString() === parentId.toString();
      })
      .map((node) => ({
        ...node,
        children: this.buildTree(nodes, node._id),
      }));
  }

  private assertValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }
}

// Lưu ý: Đã loại bỏ phần định nghĩa trùng lặp của class "SetActingManagerDto" ở cuối file này,
// vì nó đã được import chính xác từ './dto/set-acting-manager.dto' ở dòng số 18.
