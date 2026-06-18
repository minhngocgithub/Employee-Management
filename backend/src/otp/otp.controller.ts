import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import {
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  OtpResponseDto,
} from './dto/otp.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('OTP & Password Reset')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /**
   * POST /otp/forgot-password
   * Request OTP code for password reset
   * @Public - không cần token
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yêu cầu OTP để đặt lại mật khẩu',
    description: 'Gửi email với mã OTP 6 chữ số (hết hạn sau 2 phút)',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<OtpResponseDto> {
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('Email không được để trống');
    }

    return this.otpService.forgotPassword(dto.email.trim().toLowerCase());
  }

  /**
   * POST /otp/verify
   * Verify OTP code without resetting password
   * @Public - không cần token
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xác minh mã OTP',
    description: 'Kiểm tra xem mã OTP có hợp lệ và chưa hết hạn không',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ message: string }> {
    if (!dto.email || !dto.code) {
      throw new BadRequestException('Email và mã OTP không được để trống');
    }

    return this.otpService.verifyOtp(
      dto.email.trim().toLowerCase(),
      dto.code.trim(),
    );
  }

  /**
   * POST /otp/reset-password
   * Reset password using email and OTP code
   * @Public - không cần token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đặt lại mật khẩu bằng OTP',
    description: 'Đặt lại mật khẩu sau khi xác minh OTP thành công',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    if (!dto.email || !dto.code || !dto.new_password) {
      throw new BadRequestException(
        'Email, mã OTP và mật khẩu mới không được để trống',
      );
    }

    if (dto.new_password.length < 8) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 8 ký tự');
    }

    return this.otpService.resetPassword(
      dto.email.trim().toLowerCase(),
      dto.code.trim(),
      dto.new_password,
    );
  }
}
