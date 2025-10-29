import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AppLogger } from '@blog/shared-logger';
import { createRequestContext } from '@blog/shared-middleware';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(CommentsController.name);
  }

  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @Request() req: any) {
    const ctx = createRequestContext(req);
    this.appLogger.log(ctx, 'Comment creation attempt', { postId: createCommentDto.postId });
    
    try {
      // In a real app, authorId would come from authenticated user
      const authorId = createCommentDto.authorId || 'default-user-id';
      const result = this.commentsService.create(createCommentDto, authorId);
      this.appLogger.log(ctx, 'Comment created successfully', { postId: createCommentDto.postId });
      return result;
    } catch (error) {
      this.appLogger.error(ctx, 'Comment creation failed', { error: error.message });
      throw error;
    }
  }

  @Get()
  findAll(@Query('postId') postId?: string) {
    return this.commentsService.findAll(postId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}


