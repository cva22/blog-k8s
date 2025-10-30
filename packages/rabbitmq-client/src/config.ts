import { ConfigService } from '@nestjs/config';

export interface RabbitMQConfig {
  url: string;
  exchangeName: string;
  username?: string;
  password?: string;
  host?: string;
  port?: number;
}

export const DEFAULT_RABBITMQ_CONFIG: Partial<RabbitMQConfig> = {
  exchangeName: 'blog.events',
  host: 'localhost',
  port: 5672,
  username: 'admin',
  password: 'admin',
};

export function getRabbitMQConfig(configService?: ConfigService): RabbitMQConfig {
  if (configService) {
    return {
      url: configService.get<string>('RABBITMQ_URL') || 
           `amqp://${configService.get<string>('RABBITMQ_USER', 'admin')}:${configService.get<string>('RABBITMQ_PASSWORD', 'admin')}@${configService.get<string>('RABBITMQ_HOST', 'localhost')}:${configService.get<string>('RABBITMQ_PORT', '5672')}`,
      exchangeName: configService.get<string>('RABBITMQ_EXCHANGE', 'blog.events'),
      username: configService.get<string>('RABBITMQ_USER', 'admin'),
      password: configService.get<string>('RABBITMQ_PASSWORD', 'admin'),
      host: configService.get<string>('RABBITMQ_HOST', 'localhost'),
      port: parseInt(configService.get<string>('RABBITMQ_PORT', '5672'), 10),
    };
  }

  // Fallback to defaults
  const host = process.env.RABBITMQ_HOST || DEFAULT_RABBITMQ_CONFIG.host;
  const port = process.env.RABBITMQ_PORT || DEFAULT_RABBITMQ_CONFIG.port;
  const username = process.env.RABBITMQ_USER || DEFAULT_RABBITMQ_CONFIG.username;
  const password = process.env.RABBITMQ_PASSWORD || DEFAULT_RABBITMQ_CONFIG.password;

  return {
    url: process.env.RABBITMQ_URL || `amqp://${username}:${password}@${host}:${port}`,
    exchangeName: process.env.RABBITMQ_EXCHANGE || DEFAULT_RABBITMQ_CONFIG.exchangeName!,
    username,
    password,
    host,
    port: typeof port === 'number' ? port : parseInt(port as string, 10),
  };
}

