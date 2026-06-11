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
} from './schema/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

export interface DepartmentTree extends Omit<Department, '_id'> {
  _id: Types.ObjectId;
  children: DepartmentTree[];
}

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateDepartmentDto): Promise<DepartmentDocument> {
    // Kiểm tra mã phòng ban trùng
    const exists = await this.departmentModel
      .findOne({ code: dto.code.toUpperCase() })
      .lean();
    if (exists) {
      throw new ConflictException(`Mã phòng ban '${dto.code}' đã tồn tại`);
    }

    // Validate hierarchy rules
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

  async findAll(includeInactive = false): Promise<DepartmentDocument[]> {
    const filter = includeInactive ? {} : { is_active: true };
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

    dept.manager_id = managerId ? new Types.ObjectId(managerId) : null;
    await dept.save();

    return dept.toObject() as DepartmentDocument;
  }

  // ─── Delete (soft delete) ─────────────────────────────────────────────────

  async softDelete(id: string): Promise<void> {
    this.assertValidObjectId(id);

    const dept = await this.departmentModel.findById(id);
    if (!dept) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    // Không xóa nếu còn phòng ban con active
    const hasChildren = await this.departmentModel.exists({
      parent_id: new Types.ObjectId(id),
      is_active: true,
    });
    if (hasChildren) {
      throw new BadRequestException(
        'Không thể xóa phòng ban còn có phòng ban con đang hoạt động',
      );
    }

    // Không xóa phòng ban COMPANY (root)
    if (dept.level === DepartmentLevel.COMPANY) {
      throw new BadRequestException('Không thể xóa phòng ban cấp Công ty');
    }

    dept.is_active = false;
    await dept.save();
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Validate quy tắc cây 3 cấp:
   * - COMPANY (1): không có parent
   * - BOARD (2): parent phải là COMPANY
   * - DEPARTMENT (3): parent phải là BOARD
   */
  private async validateHierarchy(
    level: DepartmentLevel,
    parentId: string | null,
  ): Promise<void> {
    if (level === DepartmentLevel.COMPANY) {
      // Chỉ được có 1 phòng ban cấp COMPANY
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

  /**
   * Đệ quy xây cây từ flat list.
   * parentId = null → lấy root (COMPANY).
   */
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
