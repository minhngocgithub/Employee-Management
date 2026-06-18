import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './schema/department.schema';
import { Employee, EmployeeSchema } from '../employees/schema/employee.schema';
import { Account, AccountSchema } from '../accounts/schema/account.schema';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsScheduler } from './departments.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsScheduler],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
