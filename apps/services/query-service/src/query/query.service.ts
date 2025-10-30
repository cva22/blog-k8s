import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RabbitMQService, BlogEvent } from '@blog/shared-rabbitmq';
import { AppLogger } from '@blog/shared-logger';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueryService implements OnModuleInit {
  private postsCache = new Map<string, any>();
  private commentsCache = new Map<string, any[]>();

  constructor(
    private httpService: HttpService,
    private rabbitMQService: RabbitMQService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(QueryService.name);
  }

  async onModuleInit() {
    // Subscribe to events that query service needs to handle for cache invalidation
    await this.rabbitMQService.subscribeToEvents(
      [
        'post.created',
        'post.updated',
        'post.deleted',
        'post.published',
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
      case 'post.created':
        this.appLogger.logServiceCall('query', 'Post created, invalidating cache', { postId: event.data.postId });
        this.invalidatePostCache(event.data.postId);
        break;
      case 'post.updated':
        this.appLogger.logServiceCall('query', 'Post updated, invalidating cache', { postId: event.data.postId });
        this.invalidatePostCache(event.data.postId);
        break;
      case 'post.deleted':
        this.appLogger.logServiceCall('query', 'Post deleted, invalidating cache', { postId: event.data.postId });
        this.invalidatePostCache(event.data.postId);
        break;
      case 'post.published':
        this.appLogger.logServiceCall('query', 'Post published, invalidating cache', { postId: event.data.postId });
        this.invalidatePostCache(event.data.postId);
        break;
      case 'comment.created':
        this.appLogger.logServiceCall('query', 'Comment created, invalidating cache for post', { postId: event.data.postId });
        this.invalidateCommentsCache(event.data.postId);
        break;
      case 'comment.updated':
        this.appLogger.logServiceCall('query', 'Comment updated, invalidating cache for post', { postId: event.data.postId });
        this.invalidateCommentsCache(event.data.postId);
        break;
      case 'comment.deleted':
        this.appLogger.logServiceCall('query', 'Comment deleted, invalidating cache for post', { postId: event.data.postId });
        this.invalidateCommentsCache(event.data.postId);
        break;
      case 'content.flagged':
      case 'content.approved':
      case 'content.rejected':
        this.appLogger.logServiceCall('query', 'Content moderation event, invalidating related caches', { eventData: event.data });
        if (event.data.contentType === 'post') {
          this.invalidatePostCache(event.data.contentId);
        } else if (event.data.contentType === 'comment') {
          // Find the post ID for this comment and invalidate its comments cache
          // This would require additional logic to track comment-to-post relationships
          this.invalidateAllCommentsCache();
        }
        break;
      default:
        this.appLogger.logServiceCall('query', 'Unhandled event in query service', { eventType: event.type });
    }
  }

  private invalidatePostCache(postId: string) {
    this.postsCache.delete(postId);
    this.publishCacheInvalidationEvent(`post:${postId}`, 'Post data changed');
  }

  private invalidateCommentsCache(postId: string) {
    this.commentsCache.delete(postId);
    this.publishCacheInvalidationEvent(`comments:${postId}`, 'Comments data changed');
  }

  private invalidateAllCommentsCache() {
    this.commentsCache.clear();
    this.publishCacheInvalidationEvent('comments:*', 'All comments data changed');
  }

  private async publishCacheInvalidationEvent(cacheKey: string, reason: string) {
    const event = await this.rabbitMQService.createEvent(
      'cache.invalidated',
      {
        cacheKey,
        reason,
      },
      'query',
    );
    await this.rabbitMQService.publishEvent(event);
  }

  private readonly POSTS_SERVICE_URL = process.env.POSTS_SERVICE_URL || 'http://localhost:3002';
  private readonly COMMENTS_SERVICE_URL = process.env.COMMENTS_SERVICE_URL || 'http://localhost:3003';

  async getPostWithComments(postId: string) {
    try {
      // Check cache first
      const cachedPost = this.postsCache.get(postId);
      const cachedComments = this.commentsCache.get(postId);

      let post, comments;

      if (cachedPost && cachedComments) {
        this.appLogger.logServiceCall('query', 'Returning cached data for post', { postId });
        return {
          ...cachedPost,
          comments: cachedComments,
        };
      }

      // Fetch post if not cached
      if (!cachedPost) {
        const postResponse = await firstValueFrom(
          this.httpService.get(`${this.POSTS_SERVICE_URL}/posts/${postId}`)
        );
        post = postResponse.data;
        this.postsCache.set(postId, post);
      } else {
        post = cachedPost;
      }

      // Fetch comments if not cached
      if (!cachedComments) {
        const commentsResponse = await firstValueFrom(
          this.httpService.get(`${this.COMMENTS_SERVICE_URL}/comments?postId=${postId}`)
        );
        comments = commentsResponse.data;
        this.commentsCache.set(postId, comments);
      } else {
        comments = cachedComments;
      }

      return {
        ...post,
        comments,
      };
    } catch (error) {
      this.appLogger.logServiceError('query', 'Error fetching post with comments', { error: error.message });
      throw error;
    }
  }

  async getAllPostsWithComments() {
    try {
      // For simplicity, we'll always fetch fresh data for the list view
      // In a real implementation, you might want to implement more sophisticated caching
      
      // Fetch all published posts
      const postsResponse = await firstValueFrom(
        this.httpService.get(`${this.POSTS_SERVICE_URL}/posts?published=true`)
      );
      const posts = postsResponse.data;

      // Fetch all comments
      const commentsResponse = await firstValueFrom(
        this.httpService.get(`${this.COMMENTS_SERVICE_URL}/comments`)
      );
      const allComments = commentsResponse.data;

      // Group comments by postId
      const commentsByPost: Record<string, any[]> = {};
      allComments.forEach((comment: any) => {
        if (!commentsByPost[comment.postId]) {
          commentsByPost[comment.postId] = [];
        }
        commentsByPost[comment.postId].push(comment);
      });

      // Attach comments to posts
      const postsWithComments = posts.map((post: any) => ({
        ...post,
        comments: commentsByPost[post.id] || [],
      }));

      return postsWithComments;
    } catch (error) {
      this.appLogger.logServiceError('query', 'Error fetching all posts with comments', { error: error.message });
      throw error;
    }
  }

  // Method to manually invalidate cache (useful for testing or admin operations)
  async invalidateCache(cacheKey?: string) {
    if (cacheKey) {
      if (cacheKey.startsWith('post:')) {
        const postId = cacheKey.replace('post:', '');
        this.invalidatePostCache(postId);
      } else if (cacheKey.startsWith('comments:')) {
        const postId = cacheKey.replace('comments:', '');
        this.invalidateCommentsCache(postId);
      }
    } else {
      this.postsCache.clear();
      this.commentsCache.clear();
      this.publishCacheInvalidationEvent('*', 'Manual cache invalidation');
    }
  }

  // Method to get cache statistics
  getCacheStats() {
    return {
      postsCacheSize: this.postsCache.size,
      commentsCacheSize: this.commentsCache.size,
      postsCacheKeys: Array.from(this.postsCache.keys()),
      commentsCacheKeys: Array.from(this.commentsCache.keys()),
    };
  }
}


