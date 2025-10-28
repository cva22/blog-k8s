import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModerationActionDto } from './dto/create-moderation-action.dto';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async createModerationAction(createModerationActionDto: CreateModerationActionDto) {
    return this.prisma.moderationAction.create({
      data: {
        contentId: createModerationActionDto.contentId,
        contentType: createModerationActionDto.contentType,
        action: createModerationActionDto.action,
        moderatorId: createModerationActionDto.moderatorId || 'system',
        reason: createModerationActionDto.reason,
      },
    });
  }

  async findAllModerationActions() {
    return this.prisma.moderationAction.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.moderationAction.findUnique({
      where: { id },
    });
  }

  async getModerationHistoryForContent(contentId: string, contentType: string) {
    return this.prisma.moderationAction.findMany({
      where: {
        contentId,
        contentType,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}


