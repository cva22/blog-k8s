import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QueryModule } from './query/query.module';

@Module({
  imports: [HttpModule, QueryModule],
})
export class AppModule {}


