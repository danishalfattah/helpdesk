import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { DepartmentModule } from './department/department.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RoleModule } from './role/role.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    PrismaModule,
    AuthModule,
    DepartmentModule,
    RoleModule,
  ],
})
export class AppModule {}