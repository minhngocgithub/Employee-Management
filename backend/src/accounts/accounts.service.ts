import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  Account,
  AccountDocument,
  AccountStatus,
  MAX_FAILED_LOGIN_ATTEMPTS,
  Role,
} from './schema/account.schema';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryAccountDto } from './dto/query-account.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type LeanAccount = {
  _id: Types.ObjectId;
  email: string;
  role: Role;
  status: AccountStatus;
  failed_login_attempts: number;
  department_id: Types.ObjectId;
  employee_id: Types.ObjectId | null;
  is_first_login: boolean;
  refresh_token_hash: string | null;
};

type AccountFilter = {
  role?: Role;
  status?: AccountStatus;
  email?: { $regex: string; $options: string };
};

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateAccountDto): Promise<AccountDocument> {
    const exists = await this.accountModel
      .findOne({ email: dto.email.toLowerCase() })
      .lean<LeanAccount>();

    if (exists) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    // Tài khoản mới luôn bắt đầu ở INACTIVE — Admin kích hoạt thủ công sau
    return this.accountModel.create({
      email: dto.email.toLowerCase(),
      password_hash,
      role: dto.role,
      department_id: new Types.ObjectId(dto.department_id),
      employee_id: null,
      status: AccountStatus.INACTIVE,
      failed_login_attempts: 0,
      is_first_login: true,
    });
  }

  // ─── FindAll ──────────────────────────────────────────────────────────────

  async findAll(query: QueryAccountDto): Promise<PaginatedResult<LeanAccount>> {
    const { role, search, status, page = 1, limit = 20 } = query;

    const filter: AccountFilter = {};

    if (role !== undefined) filter.role = role;
    if (status !== undefined) filter.status = status;
    if (search) {
      filter.email = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.accountModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean<LeanAccount[]>(),
      this.accountModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── FindOne ──────────────────────────────────────────────────────────────

  async findById(id: string): Promise<LeanAccount> {
    this.assertValidObjectId(id);

    const account = await this.accountModel.findById(id).lean<LeanAccount>();

    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    return account;
  }

  // ─── Update role ──────────────────────────────────────────────────────────

  async updateRole(
    id: string,
    dto: UpdateRoleDto,
    requesterId: string,
  ): Promise<LeanAccount> {
    this.assertValidObjectId(id);

    if (id === requesterId) {
      throw new BadRequestException(
        'Không thể tự thay đổi role của chính mình',
      );
    }

    const account = await this.accountModel.findById(id);
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    if (account.role === Role.ADMIN && dto.role !== Role.ADMIN) {
      throw new BadRequestException('Không thể thay đổi role của Admin');
    }

    account.role = dto.role;
    await account.save();

    return account.toObject() as unknown as LeanAccount;
  }

  // ─── Activate (Admin thủ công) ────────────────────────────────────────────
  /**
   * Admin kích hoạt tài khoản từ INACTIVE hoặc LOCKED → ACTIVE.
   * Đồng thời reset failed_login_attempts về 0.
   * Không cho phép kích hoạt tài khoản đã ACTIVE.
   */
  async activate(id: string, requesterId: string): Promise<LeanAccount> {
    this.assertValidObjectId(id);

    if (id === requesterId) {
      throw new BadRequestException(
        'Không thể tự kích hoạt tài khoản của chính mình',
      );
    }

    const account = await this.accountModel.findById(id);
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    if (account.status === AccountStatus.ACTIVE) {
      throw new BadRequestException('Tài khoản đã đang hoạt động');
    }

    // Kiểm tra đã có role chưa (US-315)
    if (!account.role) {
      throw new BadRequestException(
        'Tài khoản chưa được gán role, vui lòng gán role trước khi kích hoạt',
      );
    }

    account.status = AccountStatus.ACTIVE;
    account.failed_login_attempts = 0;
    await account.save();

    return account.toObject() as unknown as LeanAccount;
  }

  // ─── Lock (Admin thủ công) ────────────────────────────────────────────────
  /**
   * Admin khóa tài khoản đang ACTIVE → LOCKED.
   * Dùng khi nhân viên RETIRED/RESIGNED hoặc vi phạm.
   * Không cho phép lock tài khoản INACTIVE hoặc đã LOCKED.
   * Không cho phép lock tài khoản Admin.
   */
  async lock(id: string, requesterId: string): Promise<LeanAccount> {
    this.assertValidObjectId(id);

    if (id === requesterId) {
      throw new BadRequestException('Không thể khóa tài khoản của chính mình');
    }

    const account = await this.accountModel.findById(id);
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    if (account.role === Role.ADMIN) {
      throw new BadRequestException('Không thể khóa tài khoản Admin');
    }

    if (account.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException(
        'Chỉ có thể khóa tài khoản đang hoạt động (ACTIVE)',
      );
    }

    account.status = AccountStatus.LOCKED;
    await account.save();

    return account.toObject() as unknown as LeanAccount;
  }

  // ─── Auto-lock (hệ thống gọi từ auth.service khi sai MK 7 lần) ──────────
  /**
   * Tăng failed_login_attempts.
   * Nếu đạt ngưỡng MAX_FAILED_LOGIN_ATTEMPTS → tự động chuyển status = LOCKED.
   * Trả về số lần sai hiện tại và trạng thái sau khi cập nhật.
   */
  async recordFailedLogin(
    id: string,
  ): Promise<{ attempts: number; locked: boolean }> {
    this.assertValidObjectId(id);

    const account = await this.accountModel.findById(id);
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    account.failed_login_attempts = (account.failed_login_attempts ?? 0) + 1;

    const locked = account.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
    if (locked) {
      account.status = AccountStatus.LOCKED;
    }

    await account.save();

    return { attempts: account.failed_login_attempts, locked };
  }

  /**
   * Reset failed_login_attempts về 0 sau khi đăng nhập thành công.
   * Gọi từ auth.service sau khi xác thực mật khẩu thành công.
   */
  async resetFailedLogin(id: string): Promise<void> {
    this.assertValidObjectId(id);

    await this.accountModel.findByIdAndUpdate(id, {
      $set: { failed_login_attempts: 0 },
    });
  }

  // ─── Reset password ───────────────────────────────────────────────────────

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<void> {
    this.assertValidObjectId(id);

    const account = await this.accountModel.findById(id);
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    account.password_hash = await bcrypt.hash(dto.newPassword, 10);
    account.refresh_token_hash = null;
    await account.save();
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private assertValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }
}
