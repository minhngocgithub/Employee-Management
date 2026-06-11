/**
 * Script test kết nối Atlas độc lập.
 * Chạy: npx ts-node src/test-connection.ts
 */
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI không tìm thấy trong file .env');
  process.exit(1);
}

async function testConnection(): Promise<void> {
  console.log('Đang kết nối tới MongoDB Atlas...');

  try {
    await mongoose.connect(uri as string, { serverSelectionTimeoutMS: 10000 });

    const { host, port, name } = mongoose.connection;
    const state =
      mongoose.connection.readyState === mongoose.ConnectionStates.connected
        ? 'connected'
        : 'unknown';

    console.log('Kết nối thành công!');
    console.log(`  Host    : ${host}`);
    console.log(`  Port    : ${port}`);
    console.log(`  Database: ${name}`);
    console.log(`  State   : ${state}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Kết nối thất bại:', message);
    console.log('\nKiểm tra lại:');
    console.log('  1. MONGODB_URI trong .env có đúng không?');
    console.log('  2. IP của bạn đã được whitelist trên Atlas chưa?');
    console.log('  3. Username/password trong URI có chính xác không?');
  } finally {
    await mongoose.disconnect();
    console.log('\nĐã đóng kết nối.');
  }
}

void testConnection();
