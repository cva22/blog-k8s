import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProcessedEventById(id: string) {
    return this.prisma.processedEvent.findUnique({ where: { id } });
  }
  async createProcessedEvent(id: string) {
    return this.prisma.processedEvent.create({ data: { id } });
  }

  async createPost(createPostDto: CreatePostDto, authorId: string) {
    return this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        authorId,
        published: createPostDto.published || false,
      },
    });
  }

  async findAllPosts(published?: boolean) {
    const where = published !== undefined ? { published } : {};
    return this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPostById(id: string) {
    return this.prisma.post.findUnique({ where: { id } });
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async deletePost(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  async updateManyPosts(ids: string[], published: boolean) {
    return this.prisma.post.updateMany({
      where: { id: { in: ids } },
      data: { published },
    });
  }

  async updatePostPublished(id: string, published: boolean) {
    return this.prisma.post.updateMany({
      where: { id },
      data: { published },
    });
  }
}
