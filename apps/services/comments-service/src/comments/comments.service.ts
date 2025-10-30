import { Injectable, OnModuleInit } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { RabbitMQService, BlogEvent } from '@blog/shared-rabbitmq';
import { AppLogger } from '@blog/shared-logger';

@Injectable()
export class CommentsService implements OnModuleInit {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private rabbitMQService: RabbitMQService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(CommentsService.name);
  }

  async onModuleInit() {
    // Subscribe to events that comments service needs to handle
    await this.rabbitMQService.subscribeToEvents(
      [
        'user.registered',
        'user.logged_in',
        'user.logged_out',
        'post.created',
        'post.updated',
        'post.deleted',
        'post.published',
        'content.flagged',
        'content.approved',
        'content.rejected',
      ],
      this.handleEvent.bind(this),
    );
  }

  private async handleEvent(event: BlogEvent) {
    // Idempotency: skip if already processed
    const already = await this.commentsRepository.findProcessedEventById(event.id).catch(() => null);
    if (already) {
      return;
    }

    switch (event.type) {
      case 'user.registered':
        this.appLogger.logServiceCall('comments', 'New user registered, comments service notified', { eventData: event.data });
        break;
      case 'user.logged_in':
        this.appLogger.logServiceCall('comments', 'User logged in, comments service notified', { eventData: event.data });
        break;
      case 'user.logged_out':
        this.appLogger.logServiceCall('comments', 'User logged out, comments service notified', { eventData: event.data });
        break;
      case 'post.created':
        this.appLogger.logServiceCall('comments', 'New post created, comments service notified', { eventData: event.data });
        break;
      case 'post.updated':
        this.appLogger.logServiceCall('comments', 'Post updated, comments service notified', { eventData: event.data });
        break;
      case 'post.deleted':
        this.appLogger.logServiceCall('comments', 'Post deleted, comments service notified', { eventData: event.data });
        // Could implement cascade delete of comments here
        break;
      case 'post.published':
        this.appLogger.logServiceCall('comments', 'Post published, comments service notified', { eventData: event.data });
        break;
      case 'content.flagged':
        if (event.data.contentType === 'comment') {
          this.appLogger.logServiceCall('comments', 'Comment flagged', { eventData: event.data });
          await this.commentsRepository.updateCommentVisibility(event.data.contentId, false);
        }
        break;
      case 'content.approved':
        if (event.data.contentType === 'comment') {
          this.appLogger.logServiceCall('comments', 'Comment approved', { eventData: event.data });
          await this.commentsRepository.updateCommentVisibility(event.data.contentId, true);
        }
        break;
      case 'content.rejected':
        if (event.data.contentType === 'comment') {
          this.appLogger.logServiceCall('comments', 'Comment rejected', { eventData: event.data });
          await this.commentsRepository.updateCommentVisibility(event.data.contentId, false);
        }
        break;
      default:
        this.appLogger.logServiceCall('comments', 'Unhandled event in comments service', { eventType: event.type });
    }
  }

  async create(createCommentDto: CreateCommentDto, authorId: string) {
    const comment = await this.commentsRepository.createComment(createCommentDto, authorId);

    // Publish comment created event
    const event = await this.rabbitMQService.createEvent(
      'comment.created',
      {
        commentId: comment.id,
        postId: comment.postId,
        content: comment.content,
        authorId: comment.authorId,
      },
      'comments',
    );
    await this.rabbitMQService.publishEvent(event);

    return comment;
  }

  async findAll(postId?: string) {
    return this.commentsRepository.findAllComments(postId);
  }

  async findOne(id: string) {
    return this.commentsRepository.findCommentById(id);
  }

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    const existingComment = await this.commentsRepository.findCommentById(id);

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    const comment = await this.commentsRepository.updateComment(id, updateCommentDto);

    // Publish comment updated event
    const event = await this.rabbitMQService.createEvent(
      'comment.updated',
      {
        commentId: comment.id,
        postId: comment.postId,
        content: comment.content,
        authorId: comment.authorId,
      },
      'comments',
    );
    await this.rabbitMQService.publishEvent(event);

    return comment;
  }

  async remove(id: string) {
    const comment = await this.commentsRepository.findCommentById(id);

    if (!comment) {
      throw new Error('Comment not found');
    }

    await this.commentsRepository.deleteComment(id);

    // Publish comment deleted event
    const event = await this.rabbitMQService.createEvent(
      'comment.deleted',
      {
        commentId: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
      },
      'comments',
    );
    await this.rabbitMQService.publishEvent(event);

    return { message: 'Comment deleted successfully' };
  }
}


