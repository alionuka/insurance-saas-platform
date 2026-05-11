import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: ts-node scripts/seed-test-policy.ts <email>');
    process.exit(1);
  }

  try {
    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`Error: User with email ${email} not found.`);
      process.exit(1);
    }

    if (user.role !== 'CUSTOMER') {
      console.error(`Error: User ${email} has role ${user.role}. Only CUSTOMER role is supported.`);
      process.exit(1);
    }

    // 2. Find first Product
    const product = await prisma.insuranceProduct.findFirst();

    if (!product) {
      console.error('Error: No InsuranceProduct found in the database. Please seed products first.');
      process.exit(1);
    }

    // 3. Create Application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        productId: product.id,
        status: 'APPROVED',
      },
    });

    // 4. Create Policy
    const randomSuffix = crypto.randomUUID().substring(0, 6).toUpperCase();
    const policyNumber = `POL-TEST-${randomSuffix}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    const policy = await prisma.policy.create({
      data: {
        policyNumber,
        userId: user.id,
        productId: product.id,
        applicationId: application.id,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    console.log('Successfully provisioned test data:');
    console.log(`- User ID: ${user.id} (${user.email})`);
    console.log(`- Application ID: ${application.id}`);
    console.log(`- Policy ID: ${policy.id}`);
    console.log(`- Policy Number: ${policy.policyNumber}`);

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
