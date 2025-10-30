import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from '@blog/shared-middleware';
import { AppLogger } from '@blog/shared-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  
  // Add request ID middleware
  app.use(RequestIdMiddleware);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  // Use logger instead of console.log
  const logger = new AppLogger();
  logger.setContext('Bootstrap');
  logger.logServiceCall('auth', `Auth service is running on port ${port}`);
}
bootstrap();


