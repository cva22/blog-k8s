import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "RABBITMQ_POSTS",
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672",
          ],
          queue: "posts_events_queue",
          persistent: true,
          socketOptions: {
            noDelay: true,
          },
        },
      },
      {
        name: "RABBITMQ_COMMENTS",
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672",
          ],
          queue: "comments_events_queue",
          persistent: true,
          socketOptions: {
            noDelay: true,
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
