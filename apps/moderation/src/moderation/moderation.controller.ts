import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CreateModerationActionDto } from './dto/create-moderation-action.dto';
import { AppLogger } from '@blog/shared-logger';
import { createRequestContext } from '@blog/shared-middleware';

@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(ModerationController.name);
  }

  @Post()
  create(@Body() createModerationActionDto: CreateModerationActionDto, @Request() req: any) {
    const ctx = createRequestContext(req);
    this.appLogger.log(ctx, 'Moderation action creation attempt', { 
      contentType: createModerationActionDto.contentType,
      action: createModerationActionDto.action 
    });
    
    try {
      const result = this.moderationService.createModerationAction(createModerationActionDto);
      this.appLogger.log(ctx, 'Moderation action created successfully', { 
        contentType: createModerationActionDto.contentType,
        action: createModerationActionDto.action 
      });
      return result;
    } catch (error) {
      this.appLogger.error(ctx, 'Moderation action creation failed', { error: error.message });
      throw error;
    }
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


