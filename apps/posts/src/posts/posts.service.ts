import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RabbitMQService, BlogEvent } from '@blog/shared-rabbitmq';

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    // Subscribe to events that posts service needs to handle
    await this.rabbitMQService.subscribeToEvents(
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
        console.log('New user registered, posts service notified:', event.data);
        break;
      case 'user.logged_in':
        console.log('User logged in, posts service notified:', event.data);
        break;
      case 'user.logged_out':
        console.log('User logged out, posts service notified:', event.data);
        break;
      case 'comment.created':
        console.log('Comment created for post:', event.data);
        break;
      case 'comment.updated':
        console.log('Comment updated for post:', event.data);
        break;
      case 'comment.deleted':
        console.log('Comment deleted for post:', event.data);
        break;
      case 'content.flagged':
        if (event.data.contentType === 'post') {
          console.log('Post flagged:', event.data);
        }
        break;
      case 'content.approved':
        if (event.data.contentType === 'post') {
          console.log('Post approved:', event.data);
        }
        break;
      case 'content.rejected':
        if (event.data.contentType === 'post') {
          console.log('Post rejected:', event.data);
        }
        break;
      default:
        console.log('Unhandled event in posts service:', event.type);
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


