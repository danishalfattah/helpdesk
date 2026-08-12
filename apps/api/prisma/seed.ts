import path from 'node:path';
import { config } from 'dotenv';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '../src/generated/prisma/client.js';
import * as argon2 from 'argon2';

// seed.ts dijalankan langsung lewat tsx (bukan lewat NestJS ConfigModule),
// jadi .env di root monorepo harus dimuat manual — sama seperti prisma.config.ts.
config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Prisma 7 menghapus `datasourceUrl` dari constructor PrismaClient — dipakai
// driver adapter yang sama seperti PrismaService (lihat src/prisma/prisma.service.ts).
const adapter = new PrismaMssql(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

/** Izin awal. Bertambah seiring modul baru dibangun. */
const PERMISSIONS = [
  { key: 'ticket.view', label: 'Lihat tiket' },
  { key: 'ticket.edit', label: 'Ubah tiket' },
  { key: 'department.manage', label: 'Kelola department' },
  { key: 'category.manage', label: 'Kelola kategori' },
  { key: 'agent.manage', label: 'Kelola agent' },
  { key: 'role.manage', label: 'Kelola role' },
];

async function main(): Promise<void> {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key: p.key }, update: {}, create: p });
  }

  const admin = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: { name: 'Administrator', description: 'Akses penuh ke seluruh sistem' },
  });

  const semua = await prisma.permission.findMany();
  for (const p of semua) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: admin.id, permissionId: p.id } },
      update: {},
      create: { roleId: admin.id, permissionId: p.id },
    });
  }

  const email = 'admin@socfindo.co.id';
  const agent = await prisma.agent.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Administrator',
      passwordHash: await argon2.hash('admin12345', { type: argon2.argon2id }),
    },
  });

  await prisma.agentRole.upsert({
    where: { agentId_roleId: { agentId: agent.id, roleId: admin.id } },
    update: {},
    create: { agentId: agent.id, roleId: admin.id },
  });

  console.log(`Seed selesai. Login: ${email} / admin12345`);
  console.log('GANTI PASSWORD INI sebelum dipakai di server perusahaan.');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
