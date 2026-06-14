import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DashboardService,
  AdminDashboardStats,
  ManagerDashboardStats,
} from './dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { Role } from '../accounts/schema/account.schema';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/stats
   * Admin → thống kê toàn hệ thống.
   * Manager → thống kê phòng ban của mình.
   * Route dùng chung, service phân nhánh theo role.
   */
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('stats')
  @ApiOperation({
    summary: 'Thống kê — Admin (toàn hệ thống) / Manager (phòng ban)',
  })
  async getStats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdminDashboardStats | ManagerDashboardStats> {
    if (user.role === Role.ADMIN) {
      return this.dashboardService.getAdminStats();
    }
    return this.dashboardService.getManagerStats(user);
  }
}
