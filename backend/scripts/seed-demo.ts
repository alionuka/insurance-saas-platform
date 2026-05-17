/**
 * Run after `npx prisma migrate reset` (or against a fresh DB) to get a populated
 * demo dataset for screenshots and defense demos. 
 * Do NOT run against a database with real customer data.
 */

import { PrismaClient, UserRole, ProductType, ApplicationStatus, ClaimStatus, RiskLevel, FraudFlag, PolicyStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

function randomDate(startDaysAgo: number, endDaysAgo: number): Date {
  const start = new Date();
  start.setDate(start.getDate() - startDaysAgo);
  const end = new Date();
  end.setDate(end.getDate() - endDaysAgo);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function getOrCreateCompany(name: string, description: string) {
  let company = await prisma.company.findFirst({ where: { name } });
  if (!company) {
    company = await prisma.company.create({ data: { name, description } });
  }
  return company;
}

async function getOrCreateProduct(name: string, companyId: string, type: ProductType, basePremium: number) {
  let product = await prisma.insuranceProduct.findFirst({ where: { name, companyId } });
  if (!product) {
    product = await prisma.insuranceProduct.create({
      data: { name, companyId, type, basePremium, description: `${name} description` }
    });
  }
  return product;
}

async function getOrCreateUser(data: any) {
  let user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    user = await prisma.user.create({ data });
  }
  return user;
}

async function main() {
  console.log('Starting Demo Data Seed...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // STEP 1 — Companies
  console.log('→ Creating companies');
  const safeguard = await getOrCreateCompany('SafeGuard Insurance', 'Providing secure and reliable insurance policies for your everyday needs.');
  const apex = await getOrCreateCompany('Apex Health & Life', 'Premium life and health insurance coverage.');
  const blueshield = await getOrCreateCompany('BlueShield Property & Auto', 'Specialised property and auto insurance for homeowners and drivers across all 50 states.');

  // STEP 2 — Products
  console.log('→ Creating products');
  const products = [
    await getOrCreateProduct('SafeDrive Basic', safeguard.id, ProductType.AUTO, 80),
    await getOrCreateProduct('SafeDrive Premium Plus', safeguard.id, ProductType.AUTO, 180),
    await getOrCreateProduct('Essential Health', safeguard.id, ProductType.HEALTH, 150),
    await getOrCreateProduct('Property Protect Basic', safeguard.id, ProductType.PROPERTY, 100),
    await getOrCreateProduct('Family Comprehensive Health', apex.id, ProductType.HEALTH, 220),
    await getOrCreateProduct('SecureFuture Term Life', apex.id, ProductType.LIFE, 65),
    await getOrCreateProduct('LegacyShield Whole Life', apex.id, ProductType.LIFE, 250),
    await getOrCreateProduct('Dental Plus', apex.id, ProductType.HEALTH, 40),
    await getOrCreateProduct('HomeShield Homeowners', blueshield.id, ProductType.PROPERTY, 120),
    await getOrCreateProduct('RentSafe Renters', blueshield.id, ProductType.PROPERTY, 40),
    await getOrCreateProduct('AutoCare Standard', blueshield.id, ProductType.AUTO, 95),
    await getOrCreateProduct('HealthSecure', blueshield.id, ProductType.HEALTH, 180),
  ];

  // STEP 3 — Staff users
  console.log('→ Creating staff users');
  const staff = [
    await getOrCreateUser({ email: 'emily.agent@example.com', firstName: 'Emily', lastName: 'Davis', role: UserRole.AGENT, passwordHash }),
    await getOrCreateUser({ email: 'mike.agent@example.com', firstName: 'Mike', lastName: 'Johnson', role: UserRole.AGENT, passwordHash }),
    await getOrCreateUser({ email: 'sarah.admin@example.com', firstName: 'Sarah', lastName: 'Williams', role: UserRole.COMPANY_ADMIN, companyId: safeguard.id, passwordHash }),
    await getOrCreateUser({ email: 'tom.admin@example.com', firstName: 'Tom', lastName: 'Anderson', role: UserRole.COMPANY_ADMIN, companyId: apex.id, passwordHash }),
  ];

  let platformAdmin = await prisma.user.findUnique({ where: { email: 'admin@insurance-saas.com' } });
  if (!platformAdmin) {
     platformAdmin = await getOrCreateUser({ email: 'admin@insurance-saas.com', firstName: 'Platform', lastName: 'Admin', role: UserRole.PLATFORM_ADMIN, passwordHash });
  }

  // STEP 4 — Customers
  console.log('→ Creating customers');
  const firstNames = ['Jane', 'John', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'Liam', 'Ava', 'Noah', 'Isabella', 'Lucas', 'Mia', 'Ethan', 'Charlotte'];
  const customers: any[] = [];
  
  let alice = await prisma.user.findUnique({ where: { email: 'alice.customer@example.com' } });
  if (!alice) {
    alice = await getOrCreateUser({ email: 'alice.customer@example.com', firstName: 'Alice', lastName: 'Smith', role: UserRole.CUSTOMER, passwordHash, age: 28, annualIncome: 65000, creditScore: 720 });
  }
  customers.push(alice);

  let numAuditLogs = 0;
  const auditLogs: any[] = [];

  for (let i = 0; i < 15; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = `Demo${i}`;
    const age = Math.floor(Math.random() * (68 - 22 + 1)) + 22;
    const income = Math.floor(Math.random() * (180000 - 25000 + 1)) + 25000;
    const creditScore = Math.floor(Math.random() * (820 - 480 + 1)) + 480;
    const createdAt = randomDate(1, 90);
    
    const c = await getOrCreateUser({
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
      firstName: fn,
      lastName: ln,
      role: UserRole.CUSTOMER,
      passwordHash,
      age,
      annualIncome: income,
      creditScore,
      createdAt
    });
    customers.push(c);

    auditLogs.push({
      actorId: c.id, actorEmail: c.email, actorRole: c.role,
      action: 'USER_REGISTERED', resourceType: 'User', resourceId: c.id, createdAt: c.createdAt
    });

    const logins = Math.floor(Math.random() * 3) + 1;
    for (let l = 0; l < logins; l++) {
      auditLogs.push({
        actorId: c.id, actorEmail: c.email, actorRole: c.role,
        action: 'USER_LOGIN_SUCCESS', resourceType: 'User', resourceId: c.id, createdAt: randomDate(1, 60)
      });
    }
  }

  // STEP 5 to 9 — Applications, Policies, Payments, Claims
  console.log('→ Creating applications, policies, payments, and claims');
  
  let numActivePolicies = 0;
  let numPendingPolicies = 0;
  let numSucceededPayments = 0;
  let numFailedPayments = 0;
  let numPendingPayments = 0;
  let numNormalClaims = 0;
  let numSuspiciousClaims = 0;
  let numClaimDocs = 0;

  let totalApps = 0;
  let createdClaims = 0;

  for (let i = 0; i < 35; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const randStatus = Math.random();
    let status: ApplicationStatus = ApplicationStatus.PENDING;
    if (randStatus < 0.5) status = ApplicationStatus.APPROVED;
    else if (randStatus < 0.65) status = ApplicationStatus.REJECTED;
    else if (randStatus < 0.75) status = ApplicationStatus.UNDER_REVIEW;
    
    const appCreatedAt = randomDate(7, 80);
    const appUpdatedAt = new Date(appCreatedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);

    const application = await prisma.application.create({
      data: {
        userId: customer.id,
        productId: product.id,
        status,
        createdAt: appCreatedAt,
        updatedAt: appUpdatedAt
      }
    });
    totalApps++;

    auditLogs.push({
      actorId: customer.id, actorEmail: customer.email, actorRole: customer.role,
      action: 'APPLICATION_CREATED', resourceType: 'Application', resourceId: application.id, createdAt: appCreatedAt
    });

    if (status !== ApplicationStatus.PENDING) {
      auditLogs.push({
        actorId: customer.id, actorEmail: customer.email, actorRole: customer.role,
        action: 'APPLICATION_STATUS_CHANGED', resourceType: 'Application', resourceId: application.id, createdAt: appUpdatedAt
      });
    }

    let rScore = 50;
    let rLevel: RiskLevel = RiskLevel.MEDIUM;
    const cScore = customer.creditScore || 650;
    if (cScore > 750) { rScore = 10 + Math.random() * 15; rLevel = RiskLevel.LOW; }
    else if (cScore < 600) { rScore = 70 + Math.random() * 25; rLevel = RiskLevel.HIGH; }
    else { rScore = 35 + Math.random() * 25; }

    await prisma.riskAssessment.create({
      data: {
        applicationId: application.id,
        riskScore: rScore,
        riskLevel: rLevel,
        explanation: `Credit score is ${cScore}, indicating a ${rLevel} risk level.`,
        createdAt: appCreatedAt
      }
    });

    if (status === ApplicationStatus.APPROVED) {
      const isPendingPayment = Math.random() < 0.3;
      const polStatus = isPendingPayment ? PolicyStatus.PENDING_PAYMENT : PolicyStatus.ACTIVE;
      const startDate = new Date(appUpdatedAt.getTime() + 1000 * 60 * 60 * 24 * (1 + Math.random() * 2));
      const endDate = new Date(startDate.getTime());
      endDate.setFullYear(endDate.getFullYear() + 1);

      const policyNum = `POL-${randomUUID().slice(0, 8).toUpperCase()}`;
      const premiumAmount = product.basePremium * 12;

      const policy = await prisma.policy.create({
        data: {
          policyNumber: policyNum,
          userId: customer.id,
          productId: product.id,
          applicationId: application.id,
          status: polStatus,
          startDate,
          endDate,
          premiumAmount,
          createdAt: startDate,
          updatedAt: startDate
        }
      });

      auditLogs.push({
        actorId: customer.id, actorEmail: customer.email, actorRole: customer.role,
        action: 'POLICY_CREATED', resourceType: 'Policy', resourceId: policy.id, createdAt: startDate
      });

      if (polStatus === PolicyStatus.ACTIVE) {
        numActivePolicies++;
        auditLogs.push({
          actorId: customer.id, actorEmail: customer.email, actorRole: customer.role,
          action: 'POLICY_ACTIVATED', resourceType: 'Policy', resourceId: policy.id, createdAt: startDate
        });

        const pUuid = randomUUID();
        const hasFailed = Math.random() < 0.1;
        if (hasFailed) {
          const failedDate = new Date(startDate.getTime() - 1000 * 60 * 60 * 24);
          const pFailed = await prisma.payment.create({
            data: {
              policyId: policy.id, userId: customer.id, amount: premiumAmount,
              stripeSessionId: `cs_demo_f_${pUuid}`, stripePaymentId: null,
              status: PaymentStatus.FAILED, createdAt: failedDate, updatedAt: failedDate
            }
          });
          numFailedPayments++;
          auditLogs.push({ actorId: customer.id, actorEmail: customer.email, actorRole: customer.role, action: 'PAYMENT_INITIATED', resourceType: 'Payment', resourceId: pFailed.id, createdAt: failedDate });
        }

        const pSuccess = await prisma.payment.create({
          data: {
            policyId: policy.id, userId: customer.id, amount: premiumAmount,
            stripeSessionId: `cs_demo_${pUuid}`, stripePaymentId: `pi_demo_${pUuid}`,
            status: PaymentStatus.SUCCEEDED, createdAt: startDate, updatedAt: startDate
          }
        });
        numSucceededPayments++;
        auditLogs.push({ actorId: customer.id, actorEmail: customer.email, actorRole: customer.role, action: 'PAYMENT_INITIATED', resourceType: 'Payment', resourceId: pSuccess.id, createdAt: startDate });
        auditLogs.push({ actorId: customer.id, actorEmail: customer.email, actorRole: customer.role, action: 'PAYMENT_SUCCEEDED', resourceType: 'Payment', resourceId: pSuccess.id, createdAt: startDate });

        // Claims
        if (createdClaims < 15) {
          const isSuspicious = createdClaims % 2 === 0 && createdClaims < 10; 
          const isHighFraud = createdClaims >= 13;
          let description = "Rear-end collision at intersection, police report filed.";
          let fScore = 5 + Math.random() * 25;
          let fFlag: FraudFlag = FraudFlag.NORMAL;
          let claimAmount = 500 + Math.random() * 4500;
          if (isHighFraud) {
             description = "Total loss fire unknown origin no smoke alarm activated.";
             fScore = 92 + Math.random() * 7;
             fFlag = FraudFlag.SUSPICIOUS;
             claimAmount = 40000 + Math.random() * 40000;
             numSuspiciousClaims++;
          } else if (isSuspicious) {
             description = "Vehicle stolen no witnesses no security footage.";
             fScore = 60 + Math.random() * 30;
             fFlag = FraudFlag.SUSPICIOUS;
             claimAmount = 10000 + Math.random() * 20000;
             numSuspiciousClaims++;
          } else {
             numNormalClaims++;
          }

          const claimCreatedAt = randomDate(1, 60);
          const cStatusRand = Math.random();
          let cStatus: ClaimStatus = ClaimStatus.FILED;
          if (cStatusRand < 0.3) cStatus = ClaimStatus.IN_PROGRESS;
          else if (cStatusRand < 0.5) cStatus = ClaimStatus.APPROVED;
          else if (cStatusRand < 0.6) cStatus = ClaimStatus.DENIED;

          const claim = await prisma.claim.create({
            data: {
              userId: customer.id, applicationId: application.id, policyId: policy.id,
              amount: claimAmount, description, status: cStatus,
              createdAt: claimCreatedAt, updatedAt: claimCreatedAt
            }
          });

          auditLogs.push({ actorId: customer.id, actorEmail: customer.email, actorRole: customer.role, action: 'CLAIM_FILED', resourceType: 'Claim', resourceId: claim.id, createdAt: claimCreatedAt });
          if (cStatus !== ClaimStatus.FILED) {
             auditLogs.push({ actorId: customer.id, actorEmail: customer.email, actorRole: customer.role, action: 'CLAIM_STATUS_CHANGED', resourceType: 'Claim', resourceId: claim.id, createdAt: claimCreatedAt });
          }

          await prisma.fraudAssessment.create({
            data: {
              claimId: claim.id, fraudScore: fScore, flag: fFlag,
              explanation: isSuspicious || isHighFraud ? "Suspicious patterns detected." : "Claim appears normal.",
              createdAt: claimCreatedAt
            }
          });

          if (createdClaims % 2 === 0 && numClaimDocs < 6) {
            const uploadedAt = new Date(claimCreatedAt.getTime() + 1000 * 60 * 60 * 24);
            const doc = await prisma.claimDocument.create({
              data: {
                claimId: claim.id, filename: 'evidence.pdf', mimeType: 'application/pdf',
                sizeBytes: 1500000, url: 'https://placehold.co/600x400/png?text=evidence.pdf',
                uploadedById: customer.id, uploadedAt
              }
            });
            numClaimDocs++;
            auditLogs.push({ actorId: customer.id, actorEmail: customer.email, actorRole: customer.role, action: 'CLAIM_DOCUMENT_UPLOADED', resourceType: 'ClaimDocument', resourceId: doc.id, createdAt: uploadedAt });
          }
          createdClaims++;
        }
      } else {
        numPendingPolicies++;
        const pUuid = randomUUID();
        const pPending = await prisma.payment.create({
          data: {
            policyId: policy.id, userId: customer.id, amount: premiumAmount,
            stripeSessionId: `cs_demo_${pUuid}`, stripePaymentId: null,
            status: PaymentStatus.PENDING, createdAt: startDate, updatedAt: startDate
          }
        });
        numPendingPayments++;
        auditLogs.push({ actorId: customer.id, actorEmail: customer.email, actorRole: customer.role, action: 'PAYMENT_INITIATED', resourceType: 'Payment', resourceId: pPending.id, createdAt: startDate });
      }
    }
  }

  // STEP 10 — Audit Logs
  console.log('→ Inserting audit logs');
  const logsToInsert = auditLogs.slice(0, 100);
  await prisma.auditLog.createMany({
    data: logsToInsert
  });

  // STEP 11 — Summary
  console.log(`
  Demo data seeded:
    - 3 companies
    - ${products.length} products
    - ${customers.length + staff.length} users (${customers.length} customers + ${staff.length} staff)
    - ${totalApps} applications
    - ${numActivePolicies + numPendingPolicies} policies (${numActivePolicies} active, ${numPendingPolicies} pending payment)
    - ${numSucceededPayments + numPendingPayments + numFailedPayments} payments (${numSucceededPayments} succeeded, ${numPendingPayments} pending, ${numFailedPayments} failed)
    - ${createdClaims} claims (${numNormalClaims} normal, ${numSuspiciousClaims} suspicious)
    - ${numClaimDocs} claim documents
    - ~${logsToInsert.length} audit log entries
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
