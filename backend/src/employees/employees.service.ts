import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {
  Employee,
  EmployeeDocument,
  EmployeeStatus,
} from './schema/employee.schema';
import {
  Account,
  AccountDocument,
  Role,
} from '../accounts/schema/account.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schema/department.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeResponseDto } from './dto/create-employee-response.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { PaginatedResult } from '../accounts/accounts.service';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { generateCompanyEmail } from '../common/utils/string.helper';
import { generateTempPassword } from '../common/utils/password.helper';
import { MailService } from '../mail/mail.service';

type LeanEmployee = {
  _id: Types.ObjectId;
  account_id: Types.ObjectId;
  full_name: string;
  personal_email: string;
  phone?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  position?: string | null;
  department_id: Types.ObjectId;
  join_date: Date;
  status: EmployeeStatus;
  employee_code: string;
};

type EmployeeFilter = {
  department_id?: Types.ObjectId;
  status?: EmployeeStatus;
  $text?: { $search: string };
};

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Tạo nhân viên + tài khoản tự động trong một transaction.
   * Sinh email @company.com, mật khẩu tạm thời, gửi thông báo qua personal_email.
   */
  async create(dto: CreateEmployeeDto): Promise<CreateEmployeeResponseDto> {
    this.assertValidObjectId(dto.department_id, 'department_id');

    const department = await this.departmentModel
      .findById(dto.department_id)
      .select('is_active')
      .lean<{ is_active: boolean }>();

    if (!department) {
      throw new BadRequestException('Phòng ban không tồn tại');
    }
    if (!department.is_active) {
      throw new BadRequestException('Phòng ban đang bị vô hiệu hóa');
    }

    const domain = this.configService.get<string>(
      'COMPANY_EMAIL_DOMAIN',
      'company.com',
    );
    const baseEmail = generateCompanyEmail(dto.full_name, domain);
    const companyEmail = await this.resolveUniqueEmail(baseEmail);
    const tempPassword = generateTempPassword();
    const employeeCode = await this.generateEmployeeCode();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const [account] = await this.accountModel.create(
        [
          {
            email: companyEmail,
            password_hash: passwordHash,
            role: Role.EMPLOYEE,
            department_id: new Types.ObjectId(dto.department_id),
            employee_id: null,
            is_active: true,
            is_first_login: true,
          },
        ],
        { session },
      );

      const [employee] = await this.employeeModel.create(
        [
          {
            account_id: account._id,
            full_name: dto.full_name.trim(),
            personal_email: dto.personal_email.toLowerCase().trim(),
            employee_code: employeeCode,
            phone: dto.phone?.trim() ?? null,
            avatar_url: dto.avatar_url ?? null,
            date_of_birth: dto.date_of_birth
              ? new Date(dto.date_of_birth)
              : null,
            gender: dto.gender ?? null,
            address: dto.address ?? null,
            position: dto.position?.trim() ?? null,
            department_id: new Types.ObjectId(dto.department_id),
            join_date: new Date(dto.join_date),
            status: EmployeeStatus.ACTIVE,
          },
        ],
        { session },
      );

      await this.accountModel.findByIdAndUpdate(
        account._id,
        { employee_id: employee._id },
        { session },
      );

      await session.commitTransaction();

      void this.mailService.sendWelcomeEmail(
        dto.personal_email,
        companyEmail,
        tempPassword,
        dto.full_name.trim(),
      );

      return {
        message: 'Tạo tài khoản và hồ sơ nhân viên thành công',
        company_email: companyEmail,
        employee_code: employeeCode,
        employee: employee.toObject(),
      };
    } catch (error) {
      await session.abortTransaction();
      const message =
        error instanceof Error ? error.message : 'Lỗi không xác định';
      throw new BadRequestException(
        `Lỗi trong quá trình tạo nhân viên: ${message}`,
      );
    } finally {
      await session.endSession();
    }
  }

  async findAll(
    query: QueryEmployeeDto,
    requester: AuthenticatedUser,
  ): Promise<PaginatedResult<LeanEmployee>> {
    const { search, department_id, status, page = 1, limit = 20 } = query;

    const filter: EmployeeFilter = {};

    if (requester.role === Role.MANAGER) {
      filter.department_id = new Types.ObjectId(requester.department_id);
    } else if (department_id) {
      this.assertValidObjectId(department_id, 'department_id');
      filter.department_id = new Types.ObjectId(department_id);
    }

    if (status) filter.status = status;

    if (search) {
      filter.$text = { $search: search.trim() };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.employeeModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean<LeanEmployee[]>(),
      this.employeeModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(
    id: string,
    requester?: AuthenticatedUser,
  ): Promise<LeanEmployee> {
    this.assertValidObjectId(id, 'id');

    const employee = await this.employeeModel.findById(id).lean<LeanEmployee>();

    if (!employee) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    if (requester?.role === Role.MANAGER) {
      if (employee.department_id.toString() !== requester.department_id) {
        throw new ForbiddenException(
          'Bạn không có quyền xem nhân viên ngoài phòng ban',
        );
      }
    }

    return employee;
  }

  async findByAccountId(accountId: string): Promise<LeanEmployee> {
    this.assertValidObjectId(accountId, 'accountId');

    const employee = await this.employeeModel
      .findOne({ account_id: new Types.ObjectId(accountId) })
      .lean<LeanEmployee>();

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<LeanEmployee> {
    this.assertValidObjectId(id, 'id');

    const employee = await this.employeeModel.findById(id);
    if (!employee) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    if (dto.full_name !== undefined) employee.full_name = dto.full_name.trim();
    if (dto.phone !== undefined) employee.phone = dto.phone ?? null;
    if (dto.avatar_url !== undefined)
      employee.avatar_url = dto.avatar_url ?? null;
    if (dto.date_of_birth !== undefined) {
      employee.date_of_birth = dto.date_of_birth
        ? new Date(dto.date_of_birth)
        : null;
    }
    if (dto.gender !== undefined) employee.gender = dto.gender ?? null;
    if (dto.address !== undefined) employee.address = dto.address ?? null;
    if (dto.position !== undefined) employee.position = dto.position ?? null;
    if (dto.join_date !== undefined) {
      employee.join_date = new Date(dto.join_date);
    }
    if (dto.status !== undefined) employee.status = dto.status;
    if (dto.department_id !== undefined) {
      this.assertValidObjectId(dto.department_id, 'department_id');
      employee.department_id = new Types.ObjectId(dto.department_id);
    }

    await employee.save();
    return employee.toObject() as unknown as LeanEmployee;
  }

  async resign(id: string): Promise<LeanEmployee> {
    this.assertValidObjectId(id, 'id');

    const employee = await this.employeeModel.findById(id);
    if (!employee) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    if (employee.status === EmployeeStatus.RESIGNED) {
      throw new BadRequestException('Nhân viên đã ở trạng thái nghỉ việc');
    }

    employee.status = EmployeeStatus.RESIGNED;
    await employee.save();

    return employee.toObject() as unknown as LeanEmployee;
  }

  /** Kiểm tra trùng email công ty, thêm hậu tố số nếu cần: nam.nguyen2@company.com */
  private async resolveUniqueEmail(baseEmail: string): Promise<string> {
    const [localPart, domain] = baseEmail.split('@');
    let candidate = baseEmail;
    let counter = 1;

    while (await this.accountModel.exists({ email: candidate })) {
      counter++;
      candidate = `${localPart}${counter}@${domain}`;
    }

    return candidate;
  }

  private async generateEmployeeCode(): Promise<string> {
    const now = new Date();
    const yyyymm =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0');

    const prefix = `EMP-${yyyymm}-`;

    const last = await this.employeeModel
      .findOne({ employee_code: { $regex: `^${prefix}` } })
      .sort({ employee_code: -1 })
      .select('employee_code')
      .lean<{ employee_code: string }>();

    let sequence = 1;
    if (last) {
      const parts = last.employee_code.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private assertValidObjectId(id: string, field: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${field} không hợp lệ`);
    }
  }
}
