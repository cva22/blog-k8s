import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from '@blog/shared-middleware';
import { AppLogger } from '@blog/shared-logger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  
  // Add request ID middleware
  app.use(RequestIdMiddleware);
  
  // Start RMQ microservice listener for comment.create events
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
      queue: 'comments_events_queue',
      queueOptions: { durable: true },
    },
  });
  await app.startAllMicroservices();

  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  // Use logger instead of console.log
  const logger = new AppLogger();
  logger.setContext('Bootstrap');
  logger.logServiceCall('comments', `Comments service is running on port ${port}`);
}
bootstrap();


