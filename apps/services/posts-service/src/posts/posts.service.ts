import { Injectable, OnModuleInit } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RabbitMQService, BlogEvent } from '@blog/shared-rabbitmq';
import { AppLogger } from '@blog/shared-logger';

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    private readonly postsRepository: PostsRepository,
    private rabbitMQService: RabbitMQService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(PostsService.name);
  }

  async onModuleInit() {
    // Subscribe to events that posts service needs to handle
    await this.rabbitMQService.subscribeToEvents(
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
    // Idempotency: skip if already processed
    const already = await this.postsRepository.findProcessedEventById(event.id).catch(() => null);
    if (already) {
      return;
    }

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
          await this.postsRepository.updatePostPublished(event.data.contentId, false);
        }
        break;
      case 'content.approved':
        if (event.data.contentType === 'post') {
          this.appLogger.logServiceCall('posts', 'Post approved', { eventData: event.data });
          await this.postsRepository.updatePostPublished(event.data.contentId, true);
        }
        break;
      case 'content.rejected':
        if (event.data.contentType === 'post') {
          this.appLogger.logServiceCall('posts', 'Post rejected', { eventData: event.data });
          await this.postsRepository.updatePostPublished(event.data.contentId, false);
        }
        break;
      default:
        this.appLogger.logServiceCall('posts', 'Unhandled event in posts service', { eventType: event.type });
    }

    // Mark processed
    await this.postsRepository.createProcessedEvent(event.id).catch(() => undefined);
  }

  async create(createPostDto: CreatePostDto, authorId: string) {
    const post = await this.postsRepository.createPost(createPostDto, authorId);

    // Publish post created event
    const event = await this.rabbitMQService.createEvent(
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
    await this.rabbitMQService.publishEvent(event);

    return post;
  }

  async findAll(published?: boolean) {
    return this.postsRepository.findAllPosts(published);
  }

  async findOne(id: string) {
    return this.postsRepository.findPostById(id);
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const existingPost = await this.postsRepository.findPostById(id);

    if (!existingPost) {
      throw new Error('Post not found');
    }

    const post = await this.postsRepository.updatePost(id, updatePostDto);

    // Publish post updated event
    const event = await this.rabbitMQService.createEvent(
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
    await this.rabbitMQService.publishEvent(event);

    // If post was just published, publish a separate event
    if (!existingPost.published && post.published) {
      const publishEvent = await this.rabbitMQService.createEvent(
        'post.published',
        {
          postId: post.id,
          title: post.title,
          authorId: post.authorId,
        },
        'posts',
      );
      await this.rabbitMQService.publishEvent(publishEvent);
    }

    return post;
  }

  async remove(id: string) {
    const post = await this.postsRepository.findPostById(id);

    if (!post) {
      throw new Error('Post not found');
    }

    await this.postsRepository.deletePost(id);

    // Publish post deleted event
    const event = await this.rabbitMQService.createEvent(
      'post.deleted',
      {
        postId: post.id,
        authorId: post.authorId,
      },
      'posts',
    );
    await this.rabbitMQService.publishEvent(event);

    return { message: 'Post deleted successfully' };
  }
}


