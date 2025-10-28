import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CreateModerationActionDto } from './dto/create-moderation-action.dto';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  create(@Body() createModerationActionDto: CreateModerationActionDto) {
    return this.moderationService.createModerationAction(createModerationActionDto);
  }

  @Get()
  findAll() {
    return this.moderationService.findAllModerationActions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moderationService.findOne(id);
  }

  @Get('content/:contentId')
  getContentHistory(
    @Param('contentId') contentId: string,
    @Query('type') contentType: string,
  ) {
    return this.moderationService.getModerationHistoryForContent(contentId, contentType);
  }
}


