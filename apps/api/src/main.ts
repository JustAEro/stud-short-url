/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { common } from '@stud-short-url/common';

import { AppModule } from './app/app.module';

import * as dotenv from 'dotenv';
dotenv.config();

// console.log('Loaded JWT_SECRET:', process.env.JWT_SECRET);

async function bootstrap() {
  process.env.TZ = 'UTC';

  const app = await NestFactory.create(AppModule);

  Logger.log(common());

  const globalPrefix = 'api/v1';

  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 4000;

  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
