import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  JwtPayload,
  AuthenticatedUser,
} from '../strategies/jwt-payload.interface';
import { Account, AccountDocument } from '../../accounts/schema/account.schema';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {
    super({
      jwtFromRequest: (req: Request): string | null => {
        return (
          (req?.cookies as Record<string, string> | undefined)?.[
            'refresh_token'
          ] ?? null
        );
      },
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<AuthenticatedUser> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.[
      'refresh_token'
    ];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không tồn tại');
    }

    // refresh_token_hash có select:false → phải dùng .select('+refresh_token_hash')
    const account = await this.accountModel
      .findById(payload.sub)
      .select('+refresh_token_hash is_active')
      .lean<{
        _id: Types.ObjectId;
        is_active: boolean;
        refresh_token_hash: string | null;
      }>();

    if (!account || !account.is_active) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị khóa',
      );
    }

    if (!account.refresh_token_hash) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    }

    const isMatch = await bcrypt.compare(
      refreshToken,
      account.refresh_token_hash,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Trả về AuthenticatedUser — gắn vào req.user
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      department_id: payload.department_id,
      is_acting_manager: payload.is_acting_manager ?? false,
    };
  }
}
