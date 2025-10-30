import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { PostsEventConsumer } from './posts.consumer';
import { AppLoggerModule } from '@blog/shared-logger';

@Module({
  imports: [AppLoggerModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository, PostsEventConsumer],
  exports: [PostsService],
})
export class PostsModule {}


