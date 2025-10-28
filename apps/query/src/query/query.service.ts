import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueryService {
  constructor(private httpService: HttpService) {}

  private readonly POSTS_SERVICE_URL = process.env.POSTS_SERVICE_URL || 'http://localhost:3002';
  private readonly COMMENTS_SERVICE_URL = process.env.COMMENTS_SERVICE_URL || 'http://localhost:3003';

  async getPostWithComments(postId: string) {
    try {
      // Fetch post
      const postResponse = await firstValueFrom(
        this.httpService.get(`${this.POSTS_SERVICE_URL}/posts/${postId}`)
      );
      const post = postResponse.data;

      // Fetch comments for the post
      const commentsResponse = await firstValueFrom(
        this.httpService.get(`${this.COMMENTS_SERVICE_URL}/comments?postId=${postId}`)
      );
      const comments = commentsResponse.data;

      return {
        ...post,
        comments,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllPostsWithComments() {
    try {
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
      throw error;
    }
  }
}


