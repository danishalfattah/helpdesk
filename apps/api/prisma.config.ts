import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// .env ada di root monorepo, bukan di apps/api — jadi path-nya harus eksplisit.
// Ini beda dari app.module.ts yang pakai NestJS ConfigModule; file ini dibaca
// oleh Prisma CLI (migrate, generate), bukan oleh aplikasi NestJS saat runtime.
config({ path: path.join(__dirname, '..', '..', '.env') });

export default defineConfig({
  schema: 'prisma/',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
