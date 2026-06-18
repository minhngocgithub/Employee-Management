import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  declare email: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  declare email: string;

  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mã OTP phải có 6 ký tự' })
  @MaxLength(6, { message: 'Mã OTP phải có 6 ký tự' })
  declare code: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  declare email: string;

  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mã OTP phải có 6 ký tự' })
  @MaxLength(6, { message: 'Mã OTP phải có 6 ký tự' })
  declare code: string;

  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  declare new_password: string;
}

export class OtpResponseDto {
  declare message: string;
  declare expires_in: number; // seconds
}
