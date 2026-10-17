/**
 * Seeds tenant #0 — the agency itself — and applies the `agency` pack.
 * Run after migrations, once DATABASE_URL points at a real database:
 *
 *   pnpm --filter @dad-ai/db exec node -r @swc-node/register ../../prisma/seed.ts
 *
 * (or wire it as prisma's seed command). Idempotent by slug.
 */
import { join } from 'node:path';
import { getPrisma } from '../packages/db/src/index';
import { applyIndustryPack } from '../packages/packs/src/index';

async function main() {
  const prisma = getPrisma();
  const slug = process.env.AGENCY_SLUG ?? 'dad-ai';
  const ownerEmail = process.env.AGENCY_OWNER_EMAIL ?? 'owner@dad-ai.local';

  let tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Nirmaanco (Agency)', slug, industryPack: 'AGENCY', plan: 'BUSINESS' },
    });
    console.log(`Created tenant #0: ${tenant.id}`);
  } else {
    console.log(`Tenant #0 already exists: ${tenant.id}`);
  }

  const templatesRoot = join(__dirname, '../templates');
  const applied = await applyIndustryPack(prisma, tenant.id, templatesRoot);
  console.log('Applied agency pack:', applied);

  const existingOwner = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: 'OWNER' },
  });
  if (!existingOwner) {
    await prisma.user.create({ data: { tenantId: tenant.id, email: ownerEmail, role: 'OWNER' } });
    console.log(`Created owner user: ${ownerEmail}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
