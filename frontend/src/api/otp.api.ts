import { api } from 'src/lib/http';

export interface OtpResponse {
  message: string;
  expires_in: number;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  new_password: string;
}

export const otpApi = {
  /**
   * Request OTP code for password reset
   */
  forgotPassword(email: string): Promise<OtpResponse> {
    return api
      .post<OtpResponse>('/otp/forgot-password', { email })
      .then((res) => res.data);
  },

  /**
   * Verify OTP code
   */
  verifyOtp(payload: VerifyOtpPayload): Promise<{ message: string }> {
    return api
      .post<{ message: string }>('/otp/verify', payload)
      .then((res) => res.data);
  },

  /**
   * Reset password using OTP
   */
  resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    return api
      .post<{ message: string }>('/otp/reset-password', payload)
      .then((res) => res.data);
  },
};
