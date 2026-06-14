/**
 * Kiểm tra và seed admin + department gốc nếu chưa có.
 * Chạy: npx ts-node src/seed-check.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

async function main(): Promise<void> {
  if (!uri) {
    console.error('MONGODB_URI không tìm thấy trong .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db!;

  console.log(`Database: ${mongoose.connection.name}`);

  const accounts = db.collection('accounts');
  const departments = db.collection('departments');

  const existingAdmin = await accounts.findOne({ role: 'admin' });

  if (existingAdmin) {
    console.log('[Check] Admin đã tồn tại — bỏ qua seed.');
    console.log(`  Email: ${existingAdmin.email}`);
    await mongoose.disconnect();
    return;
  }

  console.log('[Check] Chưa có admin — đang seed...');

  let company = await departments.findOne({ code: 'COMPANY' });

  if (!company) {
    const result = await departments.insertOne({
      name: 'Công ty',
      code: 'COMPANY',
      level: 1,
      parent_id: null,
      manager_id: null,
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    company = await departments.findOne({ _id: result.insertedId });
    console.log('[Seed] Department COMPANY đã tạo.');
  } else {
    console.log('[Seed] Department COMPANY đã có sẵn.');
  }

  const passwordHash = await bcrypt.hash('Admin@123456', 10);

  await accounts.insertOne({
    email: 'admin@company.com',
    password_hash: passwordHash,
    role: 'admin',
    department_id: company!._id,
    employee_id: null,
    is_active: true,
    is_first_login: false,
    refresh_token_hash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('[Seed] Admin account đã tạo:');
  console.log('  Email   : admin@company.com');
  console.log('  Password: Admin@123456');

  await mongoose.disconnect();
  console.log('\nHoàn tất.');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Lỗi:', message);
  process.exit(1);
});
