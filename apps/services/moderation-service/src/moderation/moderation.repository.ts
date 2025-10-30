import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModerationActionDto } from './dto/create-moderation-action.dto';

@Injectable()
export class ModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProcessedEventById(id: string) {
    return this.prisma.processedEvent.findUnique({ where: { id } });
  }
  async createProcessedEvent(id: string) {
    return this.prisma.processedEvent.create({ data: { id } });
  }

  async createModerationAction(createModerationActionDto: CreateModerationActionDto) {
    const { moderatorId, ...rest } = createModerationActionDto;
    return this.prisma.moderationAction.create({
      data: {
        ...rest,
        moderatorId: moderatorId ?? 'system',
      },
    });
  }

  async findAllModerationActions() {
    return this.prisma.moderationAction.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findModerationActionById(id: string) {
    return this.prisma.moderationAction.findUnique({ where: { id } });
  }

  async findModerationHistoryForContent(contentId: string, contentType: string) {
    return this.prisma.moderationAction.findMany({
      where: { contentId, contentType },
      orderBy: { createdAt: 'desc' },
    });
  }
}
