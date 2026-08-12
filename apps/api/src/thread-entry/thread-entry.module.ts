import { Module } from '@nestjs/common';
import { ThreadEntryController } from './thread-entry.controller.js';
import { ThreadEntryService } from './thread-entry.service.js';

@Module({
  controllers: [ThreadEntryController],
  providers: [ThreadEntryService],
})
export class ThreadEntryModule {}