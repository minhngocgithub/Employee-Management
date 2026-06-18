import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Account, AccountDocument, Role } from './schema/account.schema';
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
  is_active: boolean;
  department_id: Types.ObjectId;
  employee_id: Types.ObjectId | null;
  refresh_token_hash: string | null;
};

// Tự định nghĩa filter shape khớp với AccountDocument fields
// Tránh dùng FilterQuery/RootFilterQuery vì mongoose v9 không export stable named type
type AccountFilter = {
  role?: Role;
  is_active?: boolean;
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

    return this.accountModel.create({
      email: dto.email.toLowerCase(),
      password_hash,
      role: dto.role,
      department_id: new Types.ObjectId(dto.department_id),
      employee_id: null,
      is_active: true,
    });
  }

  // ─── FindAll ──────────────────────────────────────────────────────────────

  async findAll(query: QueryAccountDto): Promise<PaginatedResult<LeanAccount>> {
    const { role, search, is_active, page = 1, limit = 20 } = query;

    const filter: AccountFilter = {};

    if (role) filter.role = role;
    if (typeof is_active === 'boolean') filter.is_active = is_active;
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

  // ─── Toggle active ────────────────────────────────────────────────────────

  async toggleActive(id: string, requesterId: string): Promise<LeanAccount> {
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

    account.is_active = !account.is_active;
    await account.save();

    return account.toObject() as unknown as LeanAccount;
  }

  // ─── Reset password ───────────────────────────────────────────────────────

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<void> {
    this.assertValidObjectId(id);

    const account = await this.accountModel.findById(id);
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    const plainPassword = dto.newPassword;
    account.password_hash = await bcrypt.hash(dto.newPassword, 10);
    account.refresh_token_hash = null;
    console.log('account after reset password', account);
    console.log(`[DEBUG] Mật khẩu gốc mới: ${plainPassword}`);
    await account.save();
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private assertValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }
}
