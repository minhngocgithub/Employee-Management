import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  private readonly welcomeTemplate: string;
  private readonly otpTemplate: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });

    // Đọc template HTML một lần khi khởi động
    const templateDir = join(process.cwd(), 'src/mail/template');
    this.welcomeTemplate = readFileSync(
      join(templateDir, 'welcome.html'),
      'utf-8',
    );
    this.otpTemplate = readFileSync(join(templateDir, 'otp.html'), 'utf-8');
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM', 'EMS System');
    await this.transporter.sendMail({ from, ...options });
    this.logger.log(
      `[MAIL] Gửi thành công → ${options.to} | ${options.subject}`,
    );
  }

  /** Thay tất cả placeholder {{key}} trong template */
  private render(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce(
      (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
      template,
    );
  }

  async sendWelcomeEmail(
    personalEmail: string,
    companyEmail: string,
    tempPassword: string,
    fullName: string,
  ): Promise<void> {
    const html = this.render(this.welcomeTemplate, {
      fullName,
      companyEmail,
      tempPassword,
    });

    await this.sendMail({
      to: personalEmail,
      subject: '[EMS] Tài khoản làm việc của bạn đã được tạo',
      html,
    });
  }

  /**
   * Gửi mã OTP để đặt lại mật khẩu.
   * Gọi từ otp.service.ts → forgotPassword().
   */
  async sendOtpEmail(email: string, code: string): Promise<void> {
    const html = this.render(this.otpTemplate, { otp: code });

    await this.sendMail({
      to: email,
      subject: '[EMS] Mã OTP đặt lại mật khẩu',
      html,
    });
  }

  /**
   * Gửi email xác nhận sau khi đặt lại mật khẩu thành công.
   * Không cần template riêng — nội dung đơn giản.
   */
  async sendPasswordResetConfirmation(
    email: string,
    fullName: string,
  ): Promise<void> {
    const time = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    await this.sendMail({
      to: email,
      subject: '[EMS] Mật khẩu đã được đặt lại thành công',
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
          <div style="background:#dc2626;color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1>Đặt Lại Mật Khẩu Thành Công</h1>
          </div>
          <div style="background:white;padding:30px;border-radius:0 0 8px 8px;">
            <p>Chào <strong>${fullName}</strong>,</p>
            <p>Mật khẩu tài khoản của bạn đã được đặt lại thành công lúc <strong>${time}</strong>.</p>
            <p style="color:#d97706;background:#fef3c7;padding:10px;border-radius:4px;">
              ⚠️ Nếu bạn không thực hiện thao tác này, hãy liên hệ ngay với quản trị viên hệ thống.
            </p>
            <p>Trân trọng,<br/><strong>Hệ Thống Quản Lý Nhân Sự</strong></p>
          </div>
          <div style="color:#666;font-size:12px;margin-top:20px;padding-top:20px;border-top:1px solid #eee;">
            <p>Đây là email tự động. Vui lòng không trả lời email này.</p>
          </div>
        </div>
      `,
    });
  }
}
