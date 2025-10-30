import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMQService, BlogEvent } from '@blog/shared-rabbitmq';
import { AppLogger } from '@blog/shared-logger';
import { CreateModerationActionDto } from './dto/create-moderation-action.dto';
import { ModerationRepository } from './moderation.repository';

@Injectable()
export class ModerationService implements OnModuleInit {
  constructor(
    private readonly moderationRepository: ModerationRepository,
    private rabbitMQService: RabbitMQService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(ModerationService.name);
  }

  async onModuleInit() {
    // Subscribe to events that moderation service needs to handle
    await this.rabbitMQService.subscribeToEvents(
      [
        'user.registered',
        'post.created',
        'post.updated',
        'post.published',
        'comment.created',
        'comment.updated',
      ],
      this.handleEvent.bind(this),
    );
  }

  private async handleEvent(event: BlogEvent) {
    // Idempotency: skip if already processed
    const already = await this.moderationRepository.findProcessedEventById(event.id).catch(() => null);
    if (already) {
      return;
    }

    switch (event.type) {
      case 'user.registered':
        this.appLogger.logServiceCall('moderation', 'New user registered, moderation service notified', { eventData: event.data });
        break;
      case 'post.created':
        this.appLogger.logServiceCall('moderation', 'New post created, moderation service notified', { eventData: event.data });
        // Could implement automatic flagging for review
        break;
      case 'post.updated':
        this.appLogger.logServiceCall('moderation', 'Post updated, moderation service notified', { eventData: event.data });
        break;
      case 'post.published':
        this.appLogger.logServiceCall('moderation', 'Post published, moderation service notified', { eventData: event.data });
        break;
      case 'comment.created':
        this.appLogger.logServiceCall('moderation', 'New comment created, moderation service notified', { eventData: event.data });
        // Could implement automatic flagging for review
        break;
      case 'comment.updated':
        this.appLogger.logServiceCall('moderation', 'Comment updated, moderation service notified', { eventData: event.data });
        break;
      default:
        this.appLogger.logServiceCall('moderation', 'Unhandled event in moderation service', { eventType: event.type });
    }

    // Mark processed
    await this.moderationRepository.createProcessedEvent(event.id).catch(() => undefined);
  }

  async createModerationAction(createModerationActionDto: CreateModerationActionDto) {
    const moderationAction = await this.moderationRepository.createModerationAction(createModerationActionDto);

    // Publish appropriate event based on action
    let eventType: 'content.flagged' | 'content.approved' | 'content.rejected';
    let eventData: any;

    switch (createModerationActionDto.action) {
      case 'flag':
        eventType = 'content.flagged';
        eventData = {
          contentId: createModerationActionDto.contentId,
          contentType: createModerationActionDto.contentType,
          reason: createModerationActionDto.reason,
          flaggedBy: createModerationActionDto.moderatorId || 'system',
        };
        break;
      case 'approve':
        eventType = 'content.approved';
        eventData = {
          contentId: createModerationActionDto.contentId,
          contentType: createModerationActionDto.contentType,
          moderatorId: createModerationActionDto.moderatorId || 'system',
        };
        break;
      case 'reject':
        eventType = 'content.rejected';
        eventData = {
          contentId: createModerationActionDto.contentId,
          contentType: createModerationActionDto.contentType,
          reason: createModerationActionDto.reason,
          moderatorId: createModerationActionDto.moderatorId || 'system',
        };
        break;
      default:
        return moderationAction; // No event to publish
    }

    const event = await this.rabbitMQService.createEvent(
      eventType,
      eventData,
      'moderation',
    );
    await this.rabbitMQService.publishEvent(event);

    return moderationAction;
  }

  async findAllModerationActions() {
    return this.moderationRepository.findAllModerationActions();
  }

  async findOne(id: string) {
    return this.moderationRepository.findModerationActionById(id);
  }

  async getModerationHistoryForContent(contentId: string, contentType: string) {
    return this.moderationRepository.findModerationHistoryForContent(contentId, contentType);
  }

  // Helper method to flag content
  async flagContent(contentId: string, contentType: 'post' | 'comment', reason: string, moderatorId?: string) {
    return this.createModerationAction({
      contentId,
      contentType,
      action: 'flag',
      reason,
      moderatorId,
    });
  }

  // Helper method to approve content
  async approveContent(contentId: string, contentType: 'post' | 'comment', moderatorId?: string) {
    return this.createModerationAction({
      contentId,
      contentType,
      action: 'approve',
      moderatorId,
    });
  }

  // Helper method to reject content
  async rejectContent(contentId: string, contentType: 'post' | 'comment', reason: string, moderatorId?: string) {
    return this.createModerationAction({
      contentId,
      contentType,
      action: 'reject',
      reason,
      moderatorId,
    });
  }
}


