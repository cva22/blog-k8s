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
    .setTitle('Comments Service API')
    .setDescription('Comments management service API documentation')
    .setVersion('1.0')
    .addTag('comments')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  const logger = new AppLogger();
  logger.setContext('Bootstrap');
  
  // Start RMQ microservice listener for comment.create events
  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
        queue: 'comments_events_queue',
        queueOptions: {
          durable: true,
        },
        socketOptions: {
          noDelay: true,
        },
        noAck: false,
        prefetchCount: 10,
      },
    });
    await app.startAllMicroservices();
    logger.logServiceCall('comments', 'RabbitMQ microservice connected successfully');
  } catch (error: any) {
    logger.logServiceCall('comments', `Warning: Failed to connect to RabbitMQ microservice: ${error?.message}. HTTP server will still start.`);
  }

  const port = process.env.PORT || 3003;
  await app.listen(port);

  logger.logServiceCall('comments', `Comments service is running on port ${port}`);
}
bootstrap();


