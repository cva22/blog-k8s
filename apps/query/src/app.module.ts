import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { QueryModule } from './query/query.module';
import { EventBusModule } from '@blog/shared-event-bus-client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventBusModule,
    HttpModule, 
    QueryModule
  ],
})
export class AppModule {}


