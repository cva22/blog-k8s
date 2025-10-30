import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';

/**
 * NestJS Module for RabbitMQ Client
 * Provides RabbitMQService as a global service for easy dependency injection
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RabbitMQService,
      useFactory: (configService: ConfigService) => {
        // Service name can be configured via env or will default
        const serviceName = process.env.SERVICE_NAME || 'unknown-service';
        return new RabbitMQService(configService, serviceName);
      },
      inject: [ConfigService],
    },
  ],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
