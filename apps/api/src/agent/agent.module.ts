import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller.js';
import { AgentService } from './agent.service.js';
import { PasswordService } from '../auth/password.service.js';

@Module({
  controllers: [AgentController],
  providers: [AgentService, PasswordService],
})
export class AgentModule {}
