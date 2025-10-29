import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { QueryModule } from './query/query.module';
import { RabbitMQModule } from '@blog/shared-rabbitmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RabbitMQModule,
    HttpModule, 
    QueryModule
  ],
})
export class AppModule {}


