import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { BlogEvent } from './events/event.types';
import { RabbitMQConfig, getRabbitMQConfig } from './config';

interface PublisherConnection {
  channel: amqp.Channel;
  connection: amqp.Connection | null;
  exchangeName: string;
  isConnected: boolean;
}

interface SubscriberConnection {
  channel: amqp.Channel;
  connection: amqp.Connection | null;
  exchangeName: string;
  isConnected: boolean;
  queues: Map<string, boolean>;
}

/**
 * NestJS RabbitMQ Service
 * Provides publish and subscribe functionality for RabbitMQ messaging
 */
@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly serviceName: string;
  private readonly config: RabbitMQConfig;
  
  // Publisher connection (shared within service instance)
  private publisherConnection: PublisherConnection | null = null;
  
  // Subscriber connection (per service instance)
  private subscriberConnection: SubscriberConnection | null = null;

  constructor(
    private readonly configService: ConfigService,
    serviceName?: string
  ) {
    this.serviceName = serviceName || process.env.SERVICE_NAME || 'unknown-service';
    this.config = getRabbitMQConfig(configService);
  }

  async onModuleInit() {
    this.logger.log(`Initializing RabbitMQ service for: ${this.serviceName}`);
    // Lazy initialization - connections will be established on first use
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  /**
   * Ensure publisher connection is established
   */
  private async ensurePublisherConnection(): Promise<PublisherConnection> {
    if (this.publisherConnection?.isConnected && this.publisherConnection.channel) {
      return this.publisherConnection;
    }

    try {
      this.logger.log('Establishing RabbitMQ publisher connection...');
      
      const amqpConnection = await amqp.connect(this.config.url);
      const amqpChannel = await amqpConnection.createChannel();
      
      // Create exchange
      await amqpChannel.assertExchange(this.config.exchangeName, 'topic', { durable: true });
      
      this.publisherConnection = {
        channel: amqpChannel,
        connection: amqpConnection as unknown as amqp.Connection,
        exchangeName: this.config.exchangeName,
        isConnected: true,
      };

      this.logger.log('RabbitMQ publisher connected successfully');
      
      // Handle connection errors
      amqpConnection.on('error', (error) => {
        this.logger.error('RabbitMQ publisher connection error:', error);
        if (this.publisherConnection) {
          this.publisherConnection.isConnected = false;
        }
      });

      amqpConnection.on('close', () => {
        this.logger.warn('RabbitMQ publisher connection closed');
        if (this.publisherConnection) {
          this.publisherConnection.isConnected = false;
        }
      });

      return this.publisherConnection;
    } catch (error: any) {
      this.logger.error('Failed to connect to RabbitMQ publisher:', error.message);
      throw error;
    }
  }

  /**
   * Ensure subscriber connection is established
   */
  private async ensureSubscriberConnection(): Promise<SubscriberConnection> {
    if (this.subscriberConnection?.isConnected && this.subscriberConnection.channel) {
      return this.subscriberConnection;
    }

    try {
      this.logger.log('Establishing RabbitMQ subscriber connection...');
      
      const amqpConnection = await amqp.connect(this.config.url);
      const amqpChannel = await amqpConnection.createChannel();
      
      // Create exchange
      await amqpChannel.assertExchange(this.config.exchangeName, 'topic', { durable: true });
      
      this.subscriberConnection = {
        channel: amqpChannel,
        connection: amqpConnection as unknown as amqp.Connection,
        exchangeName: this.config.exchangeName,
        isConnected: true,
        queues: new Map(),
      };

      this.logger.log('RabbitMQ subscriber connected successfully');
      
      // Handle connection errors
      amqpConnection.on('error', (error) => {
        this.logger.error('RabbitMQ subscriber connection error:', error);
        if (this.subscriberConnection) {
          this.subscriberConnection.isConnected = false;
        }
      });

      amqpConnection.on('close', () => {
        this.logger.warn('RabbitMQ subscriber connection closed');
        if (this.subscriberConnection) {
          this.subscriberConnection.isConnected = false;
        }
      });

      return this.subscriberConnection;
    } catch (error: any) {
      this.logger.error('Failed to connect to RabbitMQ subscriber:', error.message);
      throw error;
    }
  }

  /**
   * Publish an event to RabbitMQ
   */
  async publishEvent(event: BlogEvent, routingKey?: string): Promise<boolean> {
    try {
      const connection = await this.ensurePublisherConnection();
      
      if (!connection.channel) {
        this.logger.warn('Channel not available for publishing event:', event.type);
        return false;
      }
      
      const key = routingKey || event.type;
      const message = Buffer.from(JSON.stringify(event));
      
      const published = connection.channel.publish(
        connection.exchangeName,
        key,
        message,
        {
          persistent: true,
          messageId: event.id,
          timestamp: event.timestamp.getTime(),
          headers: {
            eventType: event.type,
            source: event.source,
            version: event.version,
          },
        }
      );

      if (published) {
        this.logger.log(`Event published: ${event.type} to routing key: ${key}`);
        return true;
      } else {
        this.logger.warn(`Failed to publish event: ${event.type} - buffer full`);
        return false;
      }
    } catch (error: any) {
      this.logger.error(`Error publishing event ${event.type}:`, error.message);
      return false;
    }
  }

  /**
   * Subscribe to events
   */
  async subscribeToEvents(
    eventTypes: string[],
    handler: (event: BlogEvent) => Promise<void>
  ): Promise<void> {
    try {
      const connection = await this.ensureSubscriberConnection();
      
      if (!connection.channel) {
        this.logger.warn(`Channel not available for subscribing to events for service: ${this.serviceName}`);
        return;
      }
      
      const queueName = `${this.serviceName}.events`;
      
      // Create queue if not already exists
      if (!connection.queues.has(queueName)) {
        await connection.channel.assertQueue(queueName, { durable: true });
        connection.queues.set(queueName, true);
      }
      
      // Bind queue to exchange for each event type
      for (const eventType of eventTypes) {
        await connection.channel.bindQueue(queueName, connection.exchangeName, eventType);
      }

      // Set up consumer
      await connection.channel.consume(queueName, async (msg) => {
        if (!msg || !connection.channel) return;

        try {
          const event = JSON.parse(msg.content.toString()) as BlogEvent;
          this.logger.log(`Processing event: ${event.type} for service: ${this.serviceName}`);
          
          await handler(event);
          
          // Acknowledge message
          connection.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing event for ${this.serviceName}:`, error);
          if (connection.channel) {
            connection.channel.nack(msg, false, false);
          }
        }
      }, { noAck: false });

      this.logger.log(`Subscribed to events: ${eventTypes.join(', ')} for service: ${this.serviceName}`);
    } catch (error: any) {
      this.logger.error(`Error setting up subscription for ${this.serviceName}:`, error.message);
      // Don't throw, just log the error - allows service to continue running
    }
  }

  /**
   * Create a BlogEvent
   */
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

  /**
   * Health check for RabbitMQ connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.ensurePublisherConnection();
      return connection.isConnected && connection.channel !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Close publisher connection
   */
  private async closePublisher(): Promise<void> {
    if (!this.publisherConnection) {
      return;
    }

    try {
      const { channel, connection } = this.publisherConnection;
      
      // Close channel first
      if (channel) {
        try {
          await channel.close();
        } catch (error) {
          // Channel might already be closed
          this.logger.debug('Channel already closed or error closing channel');
        }
      }
      
      // Then close connection
      if (connection) {
        try {
          await (connection as any).close();
        } catch (error) {
          // Connection might already be closed
          this.logger.debug('Connection already closed or error closing connection');
        }
      }
      
      this.publisherConnection.isConnected = false;
      this.publisherConnection = null;
      this.logger.log('RabbitMQ publisher disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting RabbitMQ publisher:', error);
    }
  }

  /**
   * Close subscriber connection
   */
  private async closeSubscriber(): Promise<void> {
    if (!this.subscriberConnection) {
      return;
    }

    try {
      const { channel, connection } = this.subscriberConnection;
      
      // Close channel first
      if (channel) {
        try {
          await channel.close();
        } catch (error) {
          // Channel might already be closed
          this.logger.debug('Channel already closed or error closing channel');
        }
      }
      
      // Then close connection
      if (connection) {
        try {
          await (connection as any).close();
        } catch (error) {
          // Connection might already be closed
          this.logger.debug('Connection already closed or error closing connection');
        }
      }
      
      this.subscriberConnection.isConnected = false;
      this.subscriberConnection = null;
      this.logger.log(`RabbitMQ subscriber disconnected for ${this.serviceName}`);
    } catch (error) {
      this.logger.error(`Error disconnecting RabbitMQ subscriber for ${this.serviceName}:`, error);
    }
  }

  /**
   * Cleanup resources on module destroy
   */
  private async cleanup(): Promise<void> {
    this.logger.log(`Cleaning up RabbitMQ connections for ${this.serviceName}...`);
    await Promise.all([
      this.closeSubscriber(),
      this.closePublisher(),
    ]);
  }
}
