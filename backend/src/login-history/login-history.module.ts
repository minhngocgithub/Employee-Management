import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LoginHistory,
  LoginHistorySchema,
} from './schema/login-history.schema';
import { Account, AccountSchema } from '../accounts/schema/account.schema';
import { LoginHistoryService } from './login-history.service';
import { LoginHistoryController } from '../login-history/login-history.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoginHistory.name, schema: LoginHistorySchema },
      { name: Account.name, schema: AccountSchema }, // cần cho populate account_id → email
    ]),
  ],
  providers: [LoginHistoryService],
  controllers: [LoginHistoryController],
  exports: [LoginHistoryService],
})
export class LoginHistoryModule {}
