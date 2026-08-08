import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  // credentials: true wajib supaya cookie sesi httpOnly ikut terkirim
  // dari browser ke API yang beda port.
  app.enableCors({
    origin: config.getOrThrow<string>('WEB_ORIGIN'),
    credentials: true,
  });

  const port = Number(config.get('API_PORT') ?? 3001);
  await app.listen(port);
  console.log(`API berjalan di http://localhost:${port}/api/v1`);
}

void bootstrap();
