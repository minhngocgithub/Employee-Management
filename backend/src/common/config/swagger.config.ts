import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Employee Management System API')
    .setDescription(
      'REST API cho hệ thống quản lý nhân viên (EMS).\n\n' +
        '**Xác thực:** Đăng nhập qua `POST /api/auth/login`, copy `accessToken` và bấm **Authorize** (Bearer JWT).\n\n' +
        '**Refresh token:** Lưu trong httpOnly cookie `refresh_token` — dùng `POST /api/auth/refresh`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token từ POST /api/auth/login',
      },
      'JWT',
    )
    .addTag('Health', 'Kiểm tra server')
    .addTag('Auth', 'Đăng nhập, đăng xuất, refresh token')
    .addTag('Accounts', 'Quản lý tài khoản (Admin)')
    .addTag('Departments', 'Phòng ban 3 cấp')
    .addTag('Employees', 'Hồ sơ nhân viên')
    .addTag('Leave Requests', 'Đơn nghỉ phép')
    .addTag('Dashboard', 'Thống kê Admin/Manager')
    .addTag('Audit Logs', 'Nhật ký thao tác (Admin)')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'EMS API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });
}
