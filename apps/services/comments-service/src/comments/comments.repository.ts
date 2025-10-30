import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProcessedEventById(id: string) {
    return this.prisma.processedEvent.findUnique({ where: { id } });
  }

  async createProcessedEvent(id: string) {
    return this.prisma.processedEvent.create({ data: { id } });
  }

  async createComment(createCommentDto: CreateCommentDto, authorId: string) {
    return this.prisma.comment.create({
      data: {
        postId: createCommentDto.postId,
        content: createCommentDto.content,
        authorId,
        visible: false,
      },
    });
  }

  async findAllComments(postId?: string) {
    const where = postId ? { postId, visible: true } : { visible: true };
    return this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCommentById(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  async updateComment(id: string, updateCommentDto: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
    });
  }

  async deleteComment(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }

  async updateManyComments(ids: string[], visible: boolean) {
    return this.prisma.comment.updateMany({
      where: { id: { in: ids }, },
      data: { visible },
    });
  }

  async updateCommentVisibility(id: string, visible: boolean) {
    return this.prisma.comment.updateMany({
      where: { id },
      data: { visible },
    });
  }
}
