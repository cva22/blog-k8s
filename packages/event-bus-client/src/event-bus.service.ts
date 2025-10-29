import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { BlogEvent } from './events/event.types';

/**
 * EventBusService - Client-side event bus service
 * 
 * This service handles ONLY client logic for connecting to and interacting with the event-bus service.
 * It does NOT start, configure, or manage the event-bus service itself.
 * 
 * The event-bus service (RabbitMQ broker) must be run as a standalone service (e.g., via Docker Compose).
 * This service connects to it as a client using the amqplib library.
 * 
 * Responsibilities:
 * - Connect to external event-bus service (RabbitMQ broker)
 * - Publish events to the event-bus
 * - Subscribe to events from the event-bus
 * - Manage client-side connection lifecycle
 */
@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private connection: any = null;
  private channel: any = null;
  private readonly exchangeName = 'blog.events';
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing Event Bus service...');
    // Connection is established lazily when first used
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Ensures a connection to the external event-bus service (RabbitMQ broker) is established.
   * This is client-side connection logic only - it connects to an existing event-bus service.
   * This is called lazily when the connection is first needed.
   */
  private async ensureConnection(): Promise<void> {
    if (this.isConnected && this.connection && this.channel) {
      return;
    }

    try {
      this.logger.log('Establishing connection to event-bus service...');
      
      // Get connection URL from config or use defaults
      // Defaults connect to the event-bus service in Docker Compose
      const host = this.configService.get<string>('EVENT_BUS_HOST', 'localhost');
      const port = this.configService.get<string>('EVENT_BUS_PORT', '5672');
      const user = this.configService.get<string>('EVENT_BUS_USER', 'admin');
      const password = this.configService.get<string>('EVENT_BUS_PASSWORD', 'admin');
      
      const url = `amqp://${user}:${password}@${host}:${port}`;
      
      this.connection = await amqp.connect(url);
      
      // Handle connection errors
      this.connection.on('error', (err) => {
        this.logger.error('Event-bus connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('Event-bus connection closed');
        this.isConnected = false;
        this.connection = null;
        this.channel = null;
      });
      
      this.channel = await this.connection.createChannel();
      
      // Assert exchange exists (creates if it doesn't)
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      this.isConnected = true;
      this.logger.log('Connected to event-bus service successfully');
      
    } catch (error) {
      this.logger.error('Failed to connect to event-bus service:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnects from the event-bus service
   */
  private async disconnect(): Promise<void> {
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
      this.logger.log('Disconnected from event-bus service');
    } catch (error) {
      this.logger.error('Error disconnecting from event-bus service:', error);
    }
  }

  /**
   * Publishes an event to the event-bus service
   * @param event The event to publish
   * @param routingKey Optional routing key (defaults to event.type)
   */
  async publishEvent(event: BlogEvent, routingKey?: string): Promise<void> {
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
        this.logger.log(`Event published: ${event.type} [${event.id}]`);
      } else {
        this.logger.warn(`Failed to publish event: ${event.type} - buffer full`);
        // In production, you might want to implement retry logic here
      }
    } catch (error) {
      this.logger.error(`Error publishing event ${event.type}:`, error);
      // Don't throw to prevent service disruption, but log the error
      throw error;
    }
  }

  /**
   * Subscribes to events for a service
   * @param serviceName The name of the service subscribing
   * @param eventTypes Array of event types to subscribe to
   * @param handler Function to handle incoming events
   */
  async subscribeToEvents(
    serviceName: string,
    eventTypes: string[],
    handler: (event: BlogEvent) => Promise<void>
  ): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.channel) {
        this.logger.warn(`Channel not available for subscribing to events for service: ${serviceName}`);
        return;
      }
      
      const queueName = `${serviceName}.events`;
      
      // Create queue with durability
      await this.channel.assertQueue(queueName, { durable: true });
      
      // Bind queue to exchange for each event type
      for (const eventType of eventTypes) {
        await this.channel.bindQueue(queueName, this.exchangeName, eventType);
        this.logger.log(`Bound queue ${queueName} to exchange with routing key: ${eventType}`);
      }

      // Set up consumer with proper error handling
      await this.channel.consume(queueName, async (msg) => {
        if (!msg || !this.channel) return;

        try {
          const event = JSON.parse(msg.content.toString()) as BlogEvent;
          this.logger.log(`Processing event: ${event.type} [${event.id}] for service: ${serviceName}`);
          
          await handler(event);
          
          // Acknowledge message after successful processing
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing event for ${serviceName}:`, error);
          // Negative acknowledge - reject and don't requeue
          // In production, you might want to send to a dead letter queue
          if (this.channel) {
            this.channel.nack(msg, false, false);
          }
        }
      }, {
        // Don't auto-acknowledge, we'll manually ack/nack based on processing result
        noAck: false,
      });

      this.logger.log(`Subscribed to events: ${eventTypes.join(', ')} for service: ${serviceName}`);
    } catch (error) {
      this.logger.error(`Error setting up subscription for ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new event with auto-generated ID and timestamp
   * @param type Event type
   * @param data Event data
   * @param source Source service name
   */
  async createEvent(
    type: BlogEvent['type'],
    data: any,
    source: string
  ): Promise<BlogEvent> {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date(),
      source,
      version: '1.0.0',
      type,
      data,
    } as BlogEvent;
  }

  /**
   * Health check to verify event-bus service connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnection();
      return this.isConnected && this.connection !== null && this.channel !== null;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}

