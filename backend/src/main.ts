import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppModule } from './app.module';
import { seedInitialData } from './index';
import { setupSwagger } from './common/config/swagger.config';
import cookieParser from 'cookie-parser';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  await seedInitialData(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  const mongoConnection = app.get<Connection>(getConnectionToken());

  mongoConnection.on('connected', () => {
    logger.log('MongoDB Atlas connected successfully');
  });

  mongoConnection.on('error', (err: Error) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoConnection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:9000',
  );

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  setupSwagger(app);

  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
