import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from '@blog/shared-middleware';
import { AppLogger } from '@blog/shared-logger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  // Add request ID middleware
  app.use(RequestIdMiddleware);
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Query Service API')
    .setDescription('Query aggregation service API documentation')
    .setVersion('1.0')
    .addTag('query')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);
  
  // Use logger instead of console.log
  const logger = new AppLogger();
  logger.setContext('Bootstrap');
  logger.logServiceCall('query', `Query service is running on port ${port}`);
  logger.logServiceCall('query', `Swagger documentation available at http://localhost:${port}/api`);
}
bootstrap();


