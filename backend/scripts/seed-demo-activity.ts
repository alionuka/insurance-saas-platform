/**
 * Seed demo activity into AuditLog for the Platform Activity chart.
 *
 * Generates ~300 realistic audit entries spread randomly across the past 30 days
 * so the Platform Admin dashboard shows a populated activity timeline.
 *
 * Usage:
 *   cd backend
 *   npx ts-node scripts/seed-demo-activity.ts
 *
 * The DATABASE_URL in your .env determines whether this writes to local or
 * production DB. Be intentional.
 */
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic mix of actions weighted toward what users do most often.
const ACTIONS = [
  { action: 'LOGIN_SUCCESS', resourceType: 'User', weight: 30 },
  { action: 'APPLICATION_CREATED', resourceType: 'Application', weight: 12 },
  { action: 'APPLICATION_APPROVED', resourceType: 'Application', weight: 8 },
  { action: 'APPLICATION_REJECTED', resourceType: 'Application', weight: 3 },
  { action: 'POLICY_ACTIVATED', resourceType: 'Policy', weight: 8 },
  { action: 'PAYMENT_SUCCEEDED', resourceType: 'Payment', weight: 10 },
  { action: 'PAYMENT_FAILED', resourceType: 'Payment', weight: 2 },
  { action: 'CLAIM_FILED', resourceType: 'Claim', weight: 6 },
  { action: 'CLAIM_APPROVED', resourceType: 'Claim', weight: 4 },
  { action: 'CLAIM_DENIED', resourceType: 'Claim', weight: 2 },
  { action: 'USER_REGISTERED', resourceType: 'User', weight: 5 },
  { action: 'PRODUCT_CREATED', resourceType: 'InsuranceProduct', weight: 2 },
  { action: 'PASSWORD_CHANGED', resourceType: 'User', weight: 2 },
  { action: 'COMPANY_APPROVED', resourceType: 'Company', weight: 1 },
];

// Build a weighted bag so random pick mirrors the weights above.
const WEIGHTED_POOL: typeof ACTIONS = [];
for (const a of ACTIONS) {
  for (let i = 0; i < a.weight; i++) WEIGHTED_POOL.push(a);
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateInLastDays(days: number): Date {
  const now = Date.now();
  const oldest = now - days * 24 * 60 * 60 * 1000;
  const randomMs = oldest + Math.random() * (now - oldest);
  return new Date(randomMs);
}

async function main() {
  console.log('🌱 Seeding demo audit activity...');

  // Fetch a small sample of real users to use as actors. We don't need many —
  // the entries are aggregated by day anyway.
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
    take: 50,
  });

  if (users.length === 0) {
    console.error('❌ No users found in DB. Seed the main schema first.');
    process.exit(1);
  }

  console.log(`Found ${users.length} actors to attribute events to.`);

  const TARGET_ENTRIES = 300;
  const DAYS = 30;
  const rows: {
    actorId: string;
    actorEmail: string;
    actorRole: UserRole;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata: any;
    createdAt: Date;
  }[] = [];

  for (let i = 0; i < TARGET_ENTRIES; i++) {
    const actor = randomChoice(users);
    const event = randomChoice(WEIGHTED_POOL);
    rows.push({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: `demo_${Math.random().toString(36).slice(2, 10)}`,
      metadata: { seeded: true, source: 'seed-demo-activity' },
      createdAt: randomDateInLastDays(DAYS),
    });
  }

  // Bulk insert.
  const result = await prisma.auditLog.createMany({ data: rows });
  console.log(`✅ Inserted ${result.count} audit log entries.`);

  // Quick distribution check — count per day, sorted.
  const byDay: Record<string, number> = {};
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
  }
  const sorted = Object.entries(byDay).sort();
  console.log('\nDaily distribution (last entries):');
  for (const [day, count] of sorted.slice(-10)) {
    console.log(`  ${day}: ${'█'.repeat(count)} (${count})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
