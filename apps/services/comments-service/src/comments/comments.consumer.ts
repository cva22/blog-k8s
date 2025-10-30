import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsEventConsumer {
  private readonly logger = new Logger(CommentsEventConsumer.name);

  constructor(private readonly commentsService: CommentsService) {}

  @EventPattern('comment.create')
  async handleCreateCommentEvent(
    @Payload() data: CreateCommentDto,
    @Ctx() context: RmqContext
  ) {
    try {
      this.logger.log(`Received comment.create event: ${JSON.stringify(data)}`);
      if (!data.authorId) {
        this.logger.error('comment.create event missing authorId. Skipping creation.');
        return;
      }
      await this.commentsService.create(data, data.authorId);
    } catch (err) {
      this.logger.error(`Failed to process comment.create event: ${err?.message}`);
    }
    // Acknowledge message
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}
