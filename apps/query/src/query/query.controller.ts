import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get('post/:id')
  getPostWithComments(@Param('id') id: string) {
    return this.queryService.getPostWithComments(id);
  }

  @Get('posts')
  getAllPostsWithComments() {
    return this.queryService.getAllPostsWithComments();
  }

  @Post('cache/invalidate')
  invalidateCache(@Body() body: { cacheKey?: string }) {
    return this.queryService.invalidateCache(body.cacheKey);
  }

  @Get('cache/stats')
  getCacheStats() {
    return this.queryService.getCacheStats();
  }
}


