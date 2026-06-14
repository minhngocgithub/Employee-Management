import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from './strategies/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /auth/login
   * @Public — không cần token.
   * Response: accessToken trong body, refreshToken trong httpOnly cookie.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập — accessToken trong body, refreshToken trong cookie',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const { tokenResponse, refreshToken } = await this.authService.login(
      dto,
      this.extractIp(req),
      this.extractUserAgent(req),
    );
    res.cookie('refresh_token', refreshToken, this.buildCookieOptions());
    return tokenResponse;
  }

  /**
   * POST /auth/logout
   * Yêu cầu Bearer token hợp lệ (JwtAuthGuard global).
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Đăng xuất — xóa refresh token' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.authService.logout(
      user.id,
      this.extractIp(req),
      this.extractUserAgent(req),
    );
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  /**
   * POST /auth/refresh
   * @Public + jwt-refresh guard: đọc cookie, validate hash trong DB, rotate token.
   */
  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token — cần cookie refresh_token' })
  async refreshTokens(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const { tokenResponse, refreshToken } =
      await this.authService.refreshTokens(user.id);
    res.cookie('refresh_token', refreshToken, this.buildCookieOptions());
    return tokenResponse;
  }

  /**
   * PATCH /auth/change-password
   * Đổi mật khẩu — bắt buộc khi must_change_password = true (đăng nhập lần đầu).
   */
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Đổi mật khẩu (bắt buộc khi đăng nhập lần đầu)' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, dto);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    maxAge: number;
    path: string;
  } {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày tính bằng ms
      path: '/',
    };
  }

  private extractIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? null;
  }

  private extractUserAgent(req: Request): string | null {
    const ua = req.headers['user-agent'];
    return typeof ua === 'string' ? ua : null;
  }
}
