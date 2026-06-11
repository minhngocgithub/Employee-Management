/**
 * Kiểm tra kết nối MongoDB và liệt kê collections.
 * Chạy: npx ts-node src/check-collections.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

const EXPECTED_COLLECTIONS = [
  'accounts',
  'employees',
  'departments',
  'leave_requests',
  'audit_logs',
  'login_history',
];

async function main(): Promise<void> {
  if (!uri) {
    console.error('MONGODB_URI không tìm thấy trong .env');
    process.exit(1);
  }

  console.log('Đang kết nối MongoDB...');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log('Kết nối thành công!');
    console.log(`  Database : ${conn.connection.name}`);
    console.log(`  Host     : ${conn.connection.host}`);

    const collections = await conn.connection.db!.listCollections().toArray();
    collections.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`\nCollections trong DB (${collections.length}):`);

    if (collections.length === 0) {
      console.log(
        '  (Chưa có collection nào — MongoDB tạo collection khi có dữ liệu insert lần đầu)',
      );
    } else {
      for (const col of collections) {
        const count = await conn.connection
          .db!.collection(col.name)
          .countDocuments();
        console.log(`  - ${col.name.padEnd(20)} ${count} document(s)`);
      }
    }

    console.log('\nEMS collections (theo schema):');
    for (const name of EXPECTED_COLLECTIONS) {
      const exists = collections.some((c) => c.name === name);
      const count = exists
        ? await conn.connection.db!.collection(name).countDocuments()
        : 0;
      console.log(
        `  ${exists ? '[✓]' : '[ ]'} ${name.padEnd(20)} ${exists ? `${count} doc(s)` : 'chưa tạo'}`,
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('\nKết nối thất bại:', message);
    console.log('\nKiểm tra:');
    console.log('  1. MONGODB_URI trong backend/.env');
    console.log('  2. IP whitelist trên MongoDB Atlas');
    console.log('  3. Username/password trong connection string');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nĐã đóng kết nối.');
  }
}

void main();
