import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AppLogger } from "@blog/shared-logger";
import { RequestIdMiddleware } from "@blog/shared-middleware";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(RequestIdMiddleware);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle("Event Service API")
    .setDescription("Event bus publisher API documentation")
    .setVersion("1.0")
    .addTag("event")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 3006;

  await app.listen(port);

  const logger = new AppLogger();
  logger.setContext("Bootstrap");
  logger.logServiceCall("event", `Event service is running on port ${port}`);
}
bootstrap();
