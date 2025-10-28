import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports: [
        ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule, ModerationModule],
})
export class AppModule {}


