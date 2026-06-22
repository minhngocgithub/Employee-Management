import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  JwtPayload,
  AuthenticatedUser,
} from '../strategies/jwt-payload.interface';
import {
  Account,
  AccountDocument,
  AccountStatus,
} from '../../accounts/schema/account.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const account = await this.accountModel
      .findById(payload.sub)
      .select('status')
      .lean<{ _id: Types.ObjectId; status: AccountStatus }>();

    if (!account || account.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc chưa được kích hoạt / đã bị khóa',
      );
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      department_id: payload.department_id,
      is_acting_manager: payload.is_acting_manager ?? false,
    };
  }
}
