import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { EventBusService, BlogEvent } from '@blog/shared-event-bus-client';
import { AppLogger } from '@blog/shared-logger';

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private eventBusService: EventBusService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(PostsService.name);
  }

  async onModuleInit() {
    // Subscribe to events that posts service needs to handle
    await this.eventBusService.subscribeToEvents(
      'posts',
      [
        'user.registered',
        'user.logged_in',
        'user.logged_out',
        'comment.created',
        'comment.updated',
        'comment.deleted',
        'content.flagged',
        'content.approved',
        'content.rejected',
      ],
      this.handleEvent.bind(this),
    );
  }

  private async handleEvent(event: BlogEvent) {
    switch (event.type) {
      case 'user.registered':
        this.appLogger.logServiceCall('posts', 'New user registered, posts service notified', { eventData: event.data });
        break;
      case 'user.logged_in':
        this.appLogger.logServiceCall('posts', 'User logged in, posts service notified', { eventData: event.data });
        break;
      case 'user.logged_out':
        this.appLogger.logServiceCall('posts', 'User logged out, posts service notified', { eventData: event.data });
        break;
      case 'comment.created':
        this.appLogger.logServiceCall('posts', 'Comment created for post', { eventData: event.data });
        break;
      case 'comment.updated':
        this.appLogger.logServiceCall('posts', 'Comment updated for post', { eventData: event.data });
        break;
      case 'comment.deleted':
        this.appLogger.logServiceCall('posts', 'Comment deleted for post', { eventData: event.data });
        break;
      case 'content.flagged':
        if (event.data.contentType === 'post') {
          this.appLogger.logServiceCall('posts', 'Post flagged', { eventData: event.data });
        }
        break;
      case 'content.approved':
        if (event.data.contentType === 'post') {
          this.appLogger.logServiceCall('posts', 'Post approved', { eventData: event.data });
        }
        break;
      case 'content.rejected':
        if (event.data.contentType === 'post') {
          this.appLogger.logServiceCall('posts', 'Post rejected', { eventData: event.data });
        }
        break;
      default:
        this.appLogger.logServiceCall('posts', 'Unhandled event in posts service', { eventType: event.type });
    }
  }

  async create(createPostDto: CreatePostDto, authorId: string) {
    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        authorId,
        published: createPostDto.published || false,
      },
    });

    // Publish post created event
    const event = await this.eventBusService.createEvent(
      'post.created',
      {
        postId: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        published: post.published,
      },
      'posts',
    );
    await this.eventBusService.publishEvent(event);

    return post;
  }

  async findAll(published?: boolean) {
    const where = published !== undefined ? { published } : {};
    
    return this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
    });
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new Error('Post not found');
    }

    const post = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });

    // Publish post updated event
    const event = await this.eventBusService.createEvent(
      'post.updated',
      {
        postId: post.id,
        title: post.title,
        content: post.content,
        published: post.published,
        authorId: post.authorId,
      },
      'posts',
    );
    await this.eventBusService.publishEvent(event);

    // If post was just published, publish a separate event
    if (!existingPost.published && post.published) {
      const publishEvent = await this.eventBusService.createEvent(
        'post.published',
        {
          postId: post.id,
          title: post.title,
          authorId: post.authorId,
        },
        'posts',
      );
      await this.eventBusService.publishEvent(publishEvent);
    }

    return post;
  }

  async remove(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    // Publish post deleted event
    const event = await this.eventBusService.createEvent(
      'post.deleted',
      {
        postId: post.id,
        authorId: post.authorId,
      },
      'posts',
    );
    await this.eventBusService.publishEvent(event);

    return { message: 'Post deleted successfully' };
  }
}


