import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

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

  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}/api`);
}

void bootstrap();
