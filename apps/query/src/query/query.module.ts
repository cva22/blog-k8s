import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { AppLoggerModule } from '@blog/shared-logger';

@Module({
  imports: [HttpModule, AppLoggerModule],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService],
})
export class QueryModule {}


