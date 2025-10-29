import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusService } from './event-bus.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}

