import { Controller, Post, Body, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

@Controller()
export class AppController {
  constructor(
    @Inject("RABBITMQ_SERVICE") private readonly client: ClientProxy,
  ) {}

  @Post("posts")
  async createPost(@Body() body: any) {
    // Structure event for posts
    await this.client.emit("post.create", body).toPromise();
    return { status: "queued", message: "Post creation event sent" };
  }

  @Post("comments")
  async createComment(@Body() body: any) {
    // Structure event for comments
    await this.client.emit("comment.create", body).toPromise();
    return { status: "queued", message: "Comment creation event sent" };
  }
}
