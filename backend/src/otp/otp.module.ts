import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { Otp, OtpSchema } from './schema/otp.schema';
import { Account, AccountSchema } from '../accounts/schema/account.schema';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    MailModule,
  ],
  providers: [OtpService],
  controllers: [OtpController],
  exports: [OtpService],
})
export class OtpModule {}
