import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller()
export class PostsEventConsumer {
  private readonly logger = new Logger(PostsEventConsumer.name);

  constructor(private readonly postsService: PostsService) {}

  @EventPattern('post.create')
  async handleCreatePostEvent(
    @Payload() data: CreatePostDto,
    @Ctx() context: RmqContext
  ) {
    try {
      this.logger.log(`Received post.create event: ${JSON.stringify(data)}`);
      if (!data.authorId) {
        this.logger.error('post.create event missing authorId. Skipping creation.');
        return;
      }
      await this.postsService.create(data, data.authorId);
    } catch (err) {
      this.logger.error(`Failed to process post.create event: ${err?.message}`);
    }
    // Acknowledge message
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}
