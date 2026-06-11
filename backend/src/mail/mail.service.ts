import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Gửi email chào mừng kèm thông tin đăng nhập.
   * Hiện tại log ra console — thay bằng Nodemailer/SendGrid khi có SMTP config.
   */
  sendWelcomeEmail(
    personalEmail: string,
    companyEmail: string,
    tempPassword: string,
    fullName: string,
  ): void {
    this.logger.log(
      `[EMAIL] Gửi tới ${personalEmail} — Chào ${fullName}, tài khoản làm việc đã được thiết lập:`,
    );
    this.logger.log(`  Email công ty: ${companyEmail}`);
    this.logger.log(`  Mật khẩu tạm thời: ${tempPassword}`);
  }
}
