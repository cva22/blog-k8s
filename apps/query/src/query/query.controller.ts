import { Controller, Get, Param } from '@nestjs/common';
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
}


