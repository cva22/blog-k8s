import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { BlogEvent } from './events/event.types';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;
  private readonly exchangeName = 'blog.events';
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing RabbitMQ service...');
    // Don't try to connect immediately, let it be lazy
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async ensureConnection() {
    if (this.isConnected && this.connection && this.channel) {
      return;
    }

    try {
      this.logger.log('Establishing RabbitMQ connection...');
      
      // Use simple URL connection for amqplib 0.10.9
      const url = 'amqp://admin:admin@localhost:5672';
      this.connection = await amqp.connect(url);
      
      this.channel = await this.connection.createChannel();
      
      // Create exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      this.isConnected = true;
      this.logger.log('RabbitMQ connected successfully');
      
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isConnected = false;
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publishEvent(event: BlogEvent, routingKey?: string) {
    try {
      await this.ensureConnection();
      
      if (!this.channel) {
        this.logger.warn('Channel not available for publishing event:', event.type);
        return;
      }
      
      const key = routingKey || event.type;
      const message = Buffer.from(JSON.stringify(event));
      
      const published = this.channel.publish(this.exchangeName, key, message, {
        persistent: true,
        messageId: event.id,
        timestamp: event.timestamp.getTime(),
        headers: {
          eventType: event.type,
          source: event.source,
          version: event.version,
        },
      });

      if (published) {
        this.logger.log(`Event published: ${event.type}`);
      } else {
        this.logger.warn(`Failed to publish event: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error publishing event ${event.type}:`, error.message);
      // Don't throw, just log the error
    }
  }

  async subscribeToEvents(
    serviceName: string,
    eventTypes: string[],
    handler: (event: BlogEvent) => Promise<void>
  ) {
    try {
      await this.ensureConnection();
      
      if (!this.channel) {
        this.logger.warn(`Channel not available for subscribing to events for service: ${serviceName}`);
        return;
      }
      
      const queueName = `${serviceName}.events`;
      
      // Create queue
      await this.channel.assertQueue(queueName, { durable: true });
      
      // Bind queue to exchange for each event type
      for (const eventType of eventTypes) {
        await this.channel.bindQueue(queueName, this.exchangeName, eventType);
      }

      // Set up consumer
      await this.channel.consume(queueName, async (msg) => {
        if (!msg || !this.channel) return;

        try {
          const event = JSON.parse(msg.content.toString()) as BlogEvent;
          this.logger.log(`Processing event: ${event.type} for service: ${serviceName}`);
          
          await handler(event);
          
          // Acknowledge message
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing event for ${serviceName}:`, error);
          if (this.channel) {
            this.channel.nack(msg, false, false);
          }
        }
      });

      this.logger.log(`Subscribed to events: ${eventTypes.join(', ')} for service: ${serviceName}`);
    } catch (error) {
      this.logger.error(`Error setting up subscription for ${serviceName}:`, error.message);
      // Don't throw, just log the error
    }
  }

  async createEvent(
    type: BlogEvent['type'],
    data: any,
    source: string
  ): Promise<BlogEvent> {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      source,
      version: '1.0.0',
      type,
      data,
    } as BlogEvent;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnection();
      return this.isConnected;
    } catch (error) {
      return false;
    }
  }
}