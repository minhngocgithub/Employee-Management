import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LeaveRequest,
  LeaveRequestSchema,
  LeaveType,
} from './schema/leave-request.schema';
import {
  AuditLog,
  AuditLogSchema,
} from '../audit-logs/schema/audit-log.schema';
// Nhóm 1 — Nghỉ phép & vắng mặt
import { AnnualLeaveSchema } from './schema/annual-leave.chema';
import { SickLeaveSchema } from './schema/sick-leave.schema';
import { UnpaidLeaveSchema } from './schema/unpaid-leave.schema';
import { MaternityLeaveSchema } from './schema/maternity-leave.schema';
import { OtherLeaveSchema } from './schema/other-leave.schema';

// Nhóm 2 — Chấm công & thời gian làm việc
import { WfhRequestSchema } from './schema/wfh.schema';
import { ShiftChangeRequestSchema } from './schema/shift-change.schema';
import { LateEarlyRequestSchema } from './schema/late-early.schema';
import { OvertimeRequestSchema } from './schema/overtime.schema';
import { AttendanceCorrectionRequestSchema } from './schema/attendance-correction.schema';

// Nhóm 3 — Tài chính & công tác
import { BusinessTripRequestSchema } from './schema/business-trip.schema';
import { SalaryAdvanceRequestSchema } from './schema/salary-advance.schema';

// Nhóm 4 — Quan hệ lao động
import { ResignationRequestSchema } from './schema/resignation.schema';

import { Employee, EmployeeSchema } from '../employees/schema/employee.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schema/department.schema';
import { Account, AccountSchema } from '../accounts/schema/account.schema';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequestsScheduler } from './leave-request.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        // Base schema + tất cả discriminator sub-schema
        name: LeaveRequest.name,
        schema: LeaveRequestSchema,
        discriminators: [
          // Nhóm 1
          { name: LeaveType.ANNUAL, schema: AnnualLeaveSchema },
          { name: LeaveType.SICK, schema: SickLeaveSchema },
          { name: LeaveType.UNPAID, schema: UnpaidLeaveSchema },
          { name: LeaveType.MATERNITY, schema: MaternityLeaveSchema },
          { name: LeaveType.OTHER_LEAVE, schema: OtherLeaveSchema },

          // Nhóm 2
          { name: LeaveType.WFH, schema: WfhRequestSchema },
          { name: LeaveType.SHIFT_CHANGE, schema: ShiftChangeRequestSchema },
          { name: LeaveType.LATE_EARLY, schema: LateEarlyRequestSchema },
          { name: LeaveType.OVERTIME, schema: OvertimeRequestSchema },
          {
            name: LeaveType.ATTENDANCE_CORRECTION,
            schema: AttendanceCorrectionRequestSchema,
          },

          // Nhóm 3
          { name: LeaveType.BUSINESS_TRIP, schema: BusinessTripRequestSchema },
          {
            name: LeaveType.SALARY_ADVANCE,
            schema: SalaryAdvanceRequestSchema,
          },

          // Nhóm 4
          { name: LeaveType.RESIGNATION, schema: ResignationRequestSchema },
        ],
      },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Account.name, schema: AccountSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService, LeaveRequestsScheduler],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
