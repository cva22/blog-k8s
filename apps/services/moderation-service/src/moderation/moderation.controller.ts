import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { CreateModerationActionDto } from './dto/create-moderation-action.dto';
import { AppLogger } from '@blog/shared-logger';
import { createRequestContext } from '@blog/shared-middleware';

@ApiTags('moderation')
@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(ModerationController.name);
  }

  @Post()
  @ApiOperation({ summary: 'Create a moderation action' })
  @ApiResponse({ status: 201, description: 'Moderation action successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
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
  @ApiOperation({ summary: 'Get all moderation actions' })
  @ApiResponse({ status: 200, description: 'List of moderation actions retrieved successfully' })
  findAll() {
    return this.moderationService.findAllModerationActions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a moderation action by ID' })
  @ApiParam({ name: 'id', description: 'Moderation action ID' })
  @ApiResponse({ status: 200, description: 'Moderation action retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Moderation action not found' })
  findOne(@Param('id') id: string) {
    return this.moderationService.findOne(id);
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Get moderation history for specific content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiQuery({ name: 'type', required: true, description: 'Content type', enum: ['post', 'comment'] })
  @ApiResponse({ status: 200, description: 'Moderation history retrieved successfully' })
  getContentHistory(
    @Param('contentId') contentId: string,
    @Query('type') contentType: string,
  ) {
    return this.moderationService.getModerationHistoryForContent(contentId, contentType);
  }
}


