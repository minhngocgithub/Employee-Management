export * from './departments/schema/department.schema';
export * from './employees/schema/employee.schema';
export * from './accounts/schema/account.schema';
export * from './login-history/schema/login-history.schema';
export * from './leave-requests/schema/leave-request.schema';
/**
 * Seed data mẫu cho Admin account và phòng ban gốc.
 * Chạy 1 lần khi khởi tạo hệ thống.
 *
 * Cách dùng trong main.ts hoặc một script riêng:
 *
 *   import { seedInitialData } from './schemas';
 *   await seedInitialData(app);
 */
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  Department,
  DepartmentLevel,
} from './departments/schema/department.schema';
import { Account, Role } from './accounts/schema/account.schema';

export async function seedInitialData(app: INestApplication): Promise<void> {
  const departmentModel = app.get<Model<Department>>(
    getModelToken(Department.name),
  );
  const accountModel = app.get<Model<Account>>(getModelToken(Account.name));

  const existingAdmin = await accountModel.findOne({ role: Role.ADMIN });
  if (existingAdmin) {
    console.log('[Seed] Admin account already exists, skipping.');
    return;
  }

  // Tạo phòng ban cấp 1 – Công ty
  const company = await departmentModel.create({
    name: 'Công ty',
    code: 'COMPANY',
    level: DepartmentLevel.COMPANY,
    parent_id: null,
    manager_id: null,
  });
  // Tạo Admin account gắn với phòng Công ty
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  await accountModel.create({
    email: 'admin@company.com',
    password_hash: passwordHash,
    role: Role.ADMIN,
    department_id: company._id,
    employee_id: null,
    is_active: true,
    is_first_login: false,
  });

  console.log('[Seed] Admin account created: admin@company.com / Admin@123456');
  console.log('[Seed] Root department created: COMPANY');
}
