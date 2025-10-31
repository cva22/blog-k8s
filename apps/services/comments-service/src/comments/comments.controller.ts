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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AppLogger } from '@blog/shared-logger';
import { createRequestContext } from '@blog/shared-middleware';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(CommentsController.name);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
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
  @ApiOperation({ summary: 'Get all comments' })
  @ApiQuery({ name: 'postId', required: false, description: 'Filter comments by post ID' })
  @ApiResponse({ status: 200, description: 'List of comments retrieved successfully' })
  findAll(@Query('postId') postId?: string) {
    return this.commentsService.findAll(postId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}


