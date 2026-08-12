import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agent/agent.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoryModule } from './category/category.module.js';
import { DepartmentModule } from './department/department.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PriorityModule } from './priority/priority.module.js';
import { RoleModule } from './role/role.module.js';
import { TicketModule } from './ticket/ticket.module.js';
import { ThreadEntryModule } from './thread-entry/thread-entry.module.js';
import { ThreadEventModule } from './thread-event/thread-event.module.js';
import { TicketStatusModule } from './ticket-status/ticket-status.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    PrismaModule,
    AgentModule,
    AuthModule,
    CategoryModule,
    DepartmentModule,
    RoleModule,
    PriorityModule,
    TicketModule,
    ThreadEntryModule,
    ThreadEventModule,
    TicketStatusModule,
  ],
})
export class AppModule {}