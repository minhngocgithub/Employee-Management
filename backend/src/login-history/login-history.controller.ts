import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginHistoryService } from './login-history.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../accounts/schema/account.schema';

@ApiTags('Login History')
@Controller('login-history')
@UseGuards(AuthGuard('jwt'))
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) {}

  /**
   * GET /login-history
   * Get login/logout history for current user or all users (admin only)
   */
  @Get()
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Lịch sử đăng nhập/đăng xuất',
    description:
      'Lấy lịch sử đăng nhập của người dùng hiện tại hoặc tất cả người dùng (admin only)',
  })
  async getLoginHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('account_id') accountId?: string,
  ) {
    return this.loginHistoryService.getLoginHistory({
      page,
      limit,
      account_id: accountId,
      current_user_id: user.id,
      current_user_role: user.role,
    });
  }

  /**
   * GET /login-history/stats
   * Get login statistics (admin only)
   */
  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Thống kê đăng nhập',
    description: 'Lấy thống kê đăng nhập theo ngày (admin only)',
  })
  async getLoginStats(@Query('days') days: number = 7) {
    return this.loginHistoryService.getLoginStats(days);
  }
}
