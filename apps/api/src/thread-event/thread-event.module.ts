import { Module } from '@nestjs/common';
import { ThreadEventController } from './thread-event.controller.js';
import { ThreadEventService } from './thread-event.service.js';

@Module({
  controllers: [ThreadEventController],
  providers: [ThreadEventService],
  exports: [ThreadEventService],
})
export class ThreadEventModule {}