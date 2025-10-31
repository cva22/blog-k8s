import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from '@blog/shared-middleware';
import { AppLogger } from '@blog/shared-logger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  // Add request ID middleware
  app.use(RequestIdMiddleware);
  
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Posts Service API')
    .setDescription('Posts management service API documentation')
    .setVersion('1.0')
    .addTag('posts')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  const logger = new AppLogger();
  logger.setContext('Bootstrap');
  
  // Start RMQ microservice listener for post.create events
  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
        queue: 'posts_events_queue',
        queueOptions: { durable: true },
      },
    });
    await app.startAllMicroservices();
    logger.logServiceCall('posts', 'RabbitMQ microservice connected successfully');
  } catch (error: any) {
    logger.logServiceCall('posts', `Warning: Failed to connect to RabbitMQ microservice: ${error?.message}. HTTP server will still start.`);
  }

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.logServiceCall('posts', `Posts service is running on port ${port}`);
}
bootstrap();


