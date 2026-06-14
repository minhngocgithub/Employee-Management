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
import { Account, AccountDocument } from '../accounts/schema/account.schema';
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

    if (!account.is_active) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      account.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const { accessToken, refreshToken } = await this.generateTokens(account);

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
        user: this.buildUserInfo(account),
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

    if (!account || !account.is_active) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị khóa',
      );
    }

    const { accessToken, refreshToken } = await this.generateTokens(account);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.accountModel.findByIdAndUpdate(accountId, {
      refresh_token_hash: refreshTokenHash,
    });

    return {
      tokenResponse: { accessToken, user: this.buildUserInfo(account) },
      refreshToken,
    };
  }

  // ─── Change password (first login / đổi mật khẩu) ─────────────────────────

  async changePassword(
    accountId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const account = await this.accountModel
      .findById(accountId)
      .select('+password_hash is_first_login');

    if (!account || !account.is_active) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị khóa',
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
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: account._id.toString(),
      email: account.email,
      role: account.role,
      department_id: account.department_id!.toString(),
    };

    const accessTtl = parseInt(
      this.configService.get<string>('JWT_ACCESS_TTL', '900'),
      10,
    );

    const refreshTtl = parseInt(
      this.configService.get<string>('JWT_REFRESH_TTL', '604800'),
      10,
    );

    console.log('================ JWT DEBUG ================');
    console.log('JWT_ACCESS_TTL =', accessTtl);
    console.log('JWT_REFRESH_TTL =', refreshTtl);
    console.log('TYPE_ACCESS =', typeof accessTtl);
    console.log('TYPE_REFRESH =', typeof refreshTtl);
    console.log(
      'JWT_ACCESS_SECRET =',
      this.configService.get('JWT_ACCESS_SECRET'),
    );
    console.log(
      'JWT_REFRESH_SECRET =',
      this.configService.get('JWT_REFRESH_SECRET'),
    );

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });

    console.log('ACCESS TOKEN GENERATED');
    console.log(accessToken);

    console.log('REFRESH TOKEN GENERATED');
    console.log(refreshToken);

    console.log('==========================================');

    return { accessToken, refreshToken };
  }

  private buildUserInfo(account: LeanAccount): TokenResponseDto['user'] {
    return {
      id: account._id.toString(),
      email: account.email,
      role: account.role,
      department_id: account.department_id!.toString(),
      employee_id: account.employee_id?.toString() ?? null,
      must_change_password: account.is_first_login === true,
    };
  }
}
