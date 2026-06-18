import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from './schema/leave-request.schema';
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
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService, LeaveRequestsScheduler],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
