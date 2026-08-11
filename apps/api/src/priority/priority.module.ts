import { Module } from '@nestjs/common';
import { PriorityController } from './priority.controller.js';
import { PriorityService } from './priority.service.js';

@Module({
  controllers: [PriorityController],
  providers: [PriorityService],
  exports: [PriorityService],
})
export class PriorityModule {}