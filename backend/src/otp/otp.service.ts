import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Otp, OtpDocument } from './schema/otp.schema';
import { Account, AccountDocument } from '../accounts/schema/account.schema';
import { Employee } from '../employees/schema/employee.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name)
    private readonly otpModel: Model<OtpDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Initiate password reset: generate OTP and send via email
   */
  async forgotPassword(
    email: string,
  ): Promise<{ message: string; expires_in: number }> {
    const account = await this.accountModel.findOne({
      email: email.toLowerCase(),
    });

    if (!account) {
      // Don't reveal if email exists (security best practice)
      this.logger.warn(
        `Forgot password attempt for non-existent email: ${email}`,
      );
      return {
        message: 'Nếu email tồn tại trong hệ thống, OTP sẽ được gửi ngay',
        expires_in: 120,
      };
    }

    if (!account.is_active) {
      throw new BadRequestException('Tài khoản này đã bị khóa');
    }

    // Invalidate previous OTP codes for this account
    await this.otpModel.updateMany(
      { account_id: account._id, type: 'password_reset', is_used: false },
      { is_used: true, used_at: new Date() },
    );

    // Generate new OTP
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const otp = new this.otpModel({
      account_id: account._id,
      email: account.email,
      code,
      type: 'password_reset',
      expires_at: expiresAt,
    });

    await otp.save();

    // Send OTP email
    try {
      this.mailService.sendOtpEmail(account.email, code);
      this.logger.log(`OTP sent successfully to ${account.email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${account.email}`, error);
      // Don't throw error - OTP is still stored and can be used
    }

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
      expires_in: 120,
    };
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(email: string, code: string): Promise<{ message: string }> {
    const account = await this.accountModel.findOne({
      email: email.toLowerCase(),
    });

    if (!account) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    // Find valid OTP
    const otp = await this.otpModel.findOne({
      account_id: account._id,
      email: account.email,
      code,
      type: 'password_reset',
      is_used: false,
      expires_at: { $gt: new Date() },
    });

    if (!otp) {
      // Increment attempt count if OTP exists but invalid
      await this.otpModel.updateOne(
        {
          account_id: account._id,
          code,
          type: 'password_reset',
          is_used: false,
        },
        { $inc: { attempt_count: 1 } },
      );

      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Check if too many attempts
    if (otp.attempt_count >= 5) {
      await this.otpModel.updateOne(
        { _id: otp._id },
        { is_used: true, used_at: new Date() },
      );
      throw new BadRequestException('Quá nhiều nỗ lực sai. Yêu cầu OTP mới');
    }

    return { message: 'OTP hợp lệ' };
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const account = await this.accountModel
      .findOne({
        email: email.toLowerCase(),
      })
      .select('+password_hash');

    if (!account) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    // Find and verify OTP
    const otp = await this.otpModel.findOne({
      account_id: account._id,
      email: account.email,
      code,
      type: 'password_reset',
      is_used: false,
      expires_at: { $gt: new Date() },
    });

    if (!otp) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update account
    await this.accountModel.updateOne(
      { _id: account._id },
      {
        password_hash: passwordHash,
        refresh_token_hash: null,
        is_first_login: false,
      },
    );

    // Mark OTP as used
    await this.otpModel.updateOne(
      { _id: otp._id },
      { is_used: true, used_at: new Date() },
    );

    // Send confirmation email
    try {
      const populated = await this.accountModel
        .findById(account._id)
        .populate<{ employee_id: Employee | null }>('employee_id')
        .lean();
      const fullName = populated?.employee_id?.full_name ?? 'Người dùng';
      this.mailService.sendPasswordResetConfirmation(account.email, fullName);
    } catch (error) {
      this.logger.error(
        `Failed to send confirmation email to ${account.email}`,
        error,
      );
      // Don't throw - password was reset successfully
    }

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  /**
   * Check if OTP is valid (without marking as used)
   */
  async checkOtpValidity(email: string, code: string): Promise<boolean> {
    const account = await this.accountModel.findOne({
      email: email.toLowerCase(),
    });

    if (!account) {
      return false;
    }

    const otp = await this.otpModel.findOne({
      account_id: account._id,
      code,
      type: 'password_reset',
      is_used: false,
      expires_at: { $gt: new Date() },
    });

    return !!otp;
  }

  /**
   * Get OTP expiration time remaining (in seconds)
   */
  async getOtpExpirationTime(email: string, code: string): Promise<number> {
    const account = await this.accountModel.findOne({
      email: email.toLowerCase(),
    });

    if (!account) {
      return 0;
    }

    const otp = await this.otpModel.findOne({
      account_id: account._id,
      code,
      type: 'password_reset',
      is_used: false,
    });

    if (!otp) {
      return 0;
    }

    const now = Date.now();
    const expiresAt = otp.expires_at.getTime();
    const secondsRemaining = Math.ceil((expiresAt - now) / 1000);

    return Math.max(0, secondsRemaining);
  }

  /**
   * Clean up expired OTPs (can be called via a cron job)
   */
  async cleanupExpiredOtps(): Promise<{ deletedCount: number }> {
    const result = await this.otpModel.deleteMany({
      expires_at: { $lt: new Date() },
    });

    this.logger.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    return { deletedCount: result.deletedCount };
  }
}
