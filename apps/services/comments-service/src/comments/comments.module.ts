import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { CommentsEventConsumer } from './comments.consumer';
import { AppLoggerModule } from '@blog/shared-logger';

@Module({
  imports: [AppLoggerModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository, CommentsEventConsumer],
  exports: [CommentsService],
})
export class CommentsModule {}


