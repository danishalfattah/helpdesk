import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    // Prisma 7 menghapus opsi `datasourceUrl` — sekarang wajib pakai driver
    // adapter. Untuk SQL Server, itu berarti @prisma/adapter-mssql, dikasih
    // connection string JDBC yang sama dengan DATABASE_URL di .env.
    const adapter = new PrismaMssql(config.getOrThrow<string>('DATABASE_URL'));
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
