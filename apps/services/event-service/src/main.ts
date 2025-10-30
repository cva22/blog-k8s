import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AppLogger } from "@blog/shared-logger";
import { RequestIdMiddleware } from "@blog/shared-middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.use(RequestIdMiddleware);

  const port = process.env.PORT || 3006;

  await app.listen(port);

  const logger = new AppLogger();
  logger.setContext("Bootstrap");
  logger.logServiceCall("event", `Event service is running on port ${port}`);
}
bootstrap();
