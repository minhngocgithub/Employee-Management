import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '../employees/schema/employee.schema';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from '../leave-requests/schema/leave-request.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schema/department.schema';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
