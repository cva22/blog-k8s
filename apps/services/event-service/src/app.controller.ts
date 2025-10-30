import { Controller, Post, Body, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

@Controller()
export class AppController {
  constructor(
    @Inject("RABBITMQ_POSTS") private readonly postsClient: ClientProxy,
    @Inject("RABBITMQ_COMMENTS") private readonly commentsClient: ClientProxy,
  ) {}

  @Post("posts")
  async createPost(@Body() body: any) {
    await this.postsClient.emit("post.create", body).toPromise();
    return { status: "queued", message: "Post creation event sent" };
  }

  @Post("comments")
  async createComment(@Body() body: any) {
    await this.commentsClient.emit("comment.create", body).toPromise();
    return { status: "queued", message: "Comment creation event sent" };
  }
}
