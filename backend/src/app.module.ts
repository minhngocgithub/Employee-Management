import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [AuthModule, EmployeesModule, DepartmentsModule, LeaveRequestsModule, AuditLogsModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
