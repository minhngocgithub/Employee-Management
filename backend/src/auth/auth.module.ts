import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { Account, AccountSchema } from '../accounts/schema/account.schema';
import { LoginHistoryModule } from '../login-history/login-history.module';

@Module({
  imports: [
    PassportModule,
    // Secret không đặt ở đây — mỗi signAsync truyền secret riêng
    // để hỗ trợ 2 secret khác nhau (access vs refresh)
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    LoginHistoryModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
