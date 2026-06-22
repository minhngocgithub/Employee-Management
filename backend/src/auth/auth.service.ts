import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  Account,
  AccountDocument,
  AccountStatus,
} from '../accounts/schema/account.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schema/department.schema';
import { LoginHistoryService } from '../login-history/login-history.service';
import { LoginAction } from '../login-history/schema/login-history.schema';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtPayload } from './strategies/jwt-payload.interface';

type LeanAccount = Account & {
  _id: Types.ObjectId;
  is_first_login?: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginHistoryService: LoginHistoryService,
  ) {}

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ tokenResponse: TokenResponseDto; refreshToken: string }> {
    const account = await this.accountModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password_hash')
      .lean<LeanAccount>();

    if (!account) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Phân biệt rõ 3 trạng thái tài khoản
    if (account.status === AccountStatus.INACTIVE) {
      throw new ForbiddenException(
        'Tài khoản chưa được kích hoạt. Vui lòng liên hệ Admin.',
      );
    }
    if (account.status === AccountStatus.LOCKED) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa. Vui lòng liên hệ Admin.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      account.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isActingManager = await this.checkIsActingManager(
      account._id.toString(),
    );

    const { accessToken, refreshToken } = await this.generateTokens(
      account,
      isActingManager,
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.accountModel.findByIdAndUpdate(account._id, {
      refresh_token_hash: refreshTokenHash,
    });

    void this.loginHistoryService.createLog({
      account_id: account._id,
      action: LoginAction.LOGIN,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return {
      tokenResponse: {
        accessToken,
        user: this.buildUserInfo(account, isActingManager),
      },
      refreshToken,
    };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(
    accountId: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    await this.accountModel.findByIdAndUpdate(accountId, {
      refresh_token_hash: null,
    });

    void this.loginHistoryService.createLog({
      account_id: new Types.ObjectId(accountId),
      action: LoginAction.LOGOUT,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refreshTokens(
    accountId: string,
  ): Promise<{ tokenResponse: TokenResponseDto; refreshToken: string }> {
    const account = await this.accountModel
      .findById(accountId)
      .lean<LeanAccount>();

    if (!account || account.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc không còn hoạt động',
      );
    }

    const isActingManager = await this.checkIsActingManager(
      account._id.toString(),
    );

    const { accessToken, refreshToken } = await this.generateTokens(
      account,
      isActingManager,
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.accountModel.findByIdAndUpdate(accountId, {
      refresh_token_hash: refreshTokenHash,
    });

    return {
      tokenResponse: {
        accessToken,
        user: this.buildUserInfo(account, isActingManager),
      },
      refreshToken,
    };
  }

  // ─── Change password ──────────────────────────────────────────────────────

  async changePassword(
    accountId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const account = await this.accountModel
      .findById(accountId)
      .select('+password_hash');

    if (!account || account.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc không còn hoạt động',
      );
    }

    const isCurrentValid = await bcrypt.compare(
      dto.current_password,
      account.password_hash,
    );
    if (!isCurrentValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    if (dto.current_password === dto.new_password) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    account.password_hash = await bcrypt.hash(dto.new_password, 10);
    account.is_first_login = false;
    account.refresh_token_hash = null;
    await account.save();

    return { message: 'Đổi mật khẩu thành công' };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async generateTokens(
    account: LeanAccount,
    isActingManager: boolean,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: account._id.toString(),
      email: account.email,
      role: account.role,
      department_id: account.department_id!.toString(),
      is_acting_manager: isActingManager,
    };

    const accessTtl = parseInt(
      this.configService.get<string>('JWT_ACCESS_TTL', '900'),
      10,
    );

    const refreshTtl = parseInt(
      this.configService.get<string>('JWT_REFRESH_TTL', '604800'),
      10,
    );

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });

    return { accessToken, refreshToken };
  }

  private buildUserInfo(
    account: LeanAccount,
    isActingManager = false,
  ): TokenResponseDto['user'] & { is_acting_manager: boolean } {
    return {
      id: account._id.toString(),
      email: account.email,
      role: account.role,
      department_id: account.department_id!.toString(),
      employee_id: account.employee_id?.toString() ?? null,
      must_change_password: account.is_first_login === true,
      is_acting_manager: isActingManager,
    };
  }

  /**
   * Kiểm tra account có đang là acting_manager_id của bất kỳ dept nào không.
   * acting_until phải null (không giới hạn) hoặc >= hôm nay.
   */
  private async checkIsActingManager(accountId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dept = await this.departmentModel
      .findOne({
        acting_manager_id: accountId,
        $or: [{ acting_until: null }, { acting_until: { $gte: today } }],
      })
      .lean();
    return !!dept;
  }
}
