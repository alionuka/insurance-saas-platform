import { PrismaClient, UserRole, ProductType, ApplicationStatus, ClaimStatus, RiskLevel, FraudFlag, PolicyStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  // Delete in reverse order to avoid foreign key constraints
  await prisma.recommendation.deleteMany();
  await prisma.fraudAssessment.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.application.deleteMany();
  await prisma.insuranceProduct.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('Seeding Database...');

  // 1. Create Companies
  const company1 = await prisma.company.create({
    data: {
      name: 'SafeGuard Insurance',
      description: 'Providing secure and reliable insurance policies for your everyday needs.',
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'Apex Health & Life',
      description: 'Premium life and health insurance coverage.',
    },
  });

  // 2. Create Users
  // Hash for "Password123!" is $2b$10$GgdGL0IGK8sy2UXsoRjHquhY3UtOsqzCAb91p9kZs6M7arj7QQnKG
  const demoPasswordHash = '$2b$10$GgdGL0IGK8sy2UXsoRjHquhY3UtOsqzCAb91p9kZs6M7arj7QQnKG';
  
  const platformAdmin = await prisma.user.create({
    data: {
      email: 'admin@insurance-saas.com',
      firstName: 'Platform',
      lastName: 'Admin',
      role: UserRole.PLATFORM_ADMIN,
      passwordHash: demoPasswordHash,
      age: 35,
    },
  });

  const companyAdmin = await prisma.user.create({
    data: {
      email: 'company.admin@example.com',
      firstName: 'Company',
      lastName: 'Admin',
      role: UserRole.COMPANY_ADMIN,
      companyId: company1.id,
      passwordHash: demoPasswordHash,
      age: 40,
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      email: 'agent@example.com',
      firstName: 'Demo',
      lastName: 'Agent',
      role: UserRole.AGENT,
      companyId: company1.id,
      passwordHash: demoPasswordHash,
      age: 42,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'alice.customer@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      role: UserRole.CUSTOMER,
      passwordHash: demoPasswordHash,
      age: 28,
      annualIncome: 65000,
      creditScore: 720,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      passwordHash: demoPasswordHash,
      age: 45,
      annualIncome: 120000,
      creditScore: 680,
    },
  });

  // 3. Create Products (AUTO, HEALTH, LIFE, PROPERTY)
  const autoProduct = await prisma.insuranceProduct.create({
    data: {
      name: 'SafeDrive Auto',
      type: ProductType.AUTO,
      description: 'Comprehensive auto insurance for all vehicles.',
      companyId: company1.id,
      basePremium: 120,
    },
  });

  const propertyProduct = await prisma.insuranceProduct.create({
    data: {
      name: 'HomeSafe Property',
      type: ProductType.PROPERTY,
      description: 'Protect your home and belongings.',
      companyId: company1.id,
      basePremium: 90,
    },
  });

  const healthProduct = await prisma.insuranceProduct.create({
    data: {
      name: 'Apex Complete Health',
      type: ProductType.HEALTH,
      description: 'Full coverage health insurance including dental and vision.',
      companyId: company2.id,
      basePremium: 200,
    },
  });

  const lifeProduct = await prisma.insuranceProduct.create({
    data: {
      name: 'Apex Term Life',
      type: ProductType.LIFE,
      description: 'Affordable term life insurance for your family.',
      companyId: company2.id,
      basePremium: 75,
    },
  });

  // 4. Create Applications
  const application1 = await prisma.application.create({
    data: {
      userId: customer1.id,
      productId: autoProduct.id,
      status: ApplicationStatus.APPROVED,
    },
  });

  // 4.1 Create Policy for the approved application
  const policyStartDate = new Date('2026-01-01T00:00:00.000Z');
  const policyEndDate = new Date('2027-01-01T00:00:00.000Z');

  const activePolicy = await prisma.policy.create({
    data: {
      policyNumber: 'POL-100001',
      userId: customer1.id,
      productId: autoProduct.id,
      applicationId: application1.id,
      status: PolicyStatus.ACTIVE,
      startDate: policyStartDate,
      endDate: policyEndDate,
    },
  });

  const application2 = await prisma.application.create({
    data: {
      userId: customer2.id,
      productId: healthProduct.id,
      status: ApplicationStatus.PENDING,
    },
  });

  // 5. Create Claims
  const claim1 = await prisma.claim.create({
    data: {
      userId: customer1.id,
      applicationId: application1.id,
      policyId: activePolicy.id,
      amount: 4500.0,
      description: 'Fender bender on highway 101',
      status: ClaimStatus.IN_PROGRESS,
    },
  });

  const claim2 = await prisma.claim.create({
    data: {
      userId: customer1.id,
      applicationId: application1.id,
      policyId: activePolicy.id,
      amount: 75000.0,
      description: 'Unwitnessed cash stolen from vehicle',
      status: ClaimStatus.FILED,
    },
  });

  // 6. Create Risk Assessments
  await prisma.riskAssessment.create({
    data: {
      applicationId: application1.id,
      riskScore: 15.0,
      riskLevel: RiskLevel.LOW,
      explanation: 'High credit score indicates low default risk.',
    },
  });

  await prisma.riskAssessment.create({
    data: {
      applicationId: application2.id,
      riskScore: 50.0,
      riskLevel: RiskLevel.MEDIUM,
      explanation: 'Average credit score indicates moderate risk.',
    },
  });

  // 7. Create Fraud Assessments
  await prisma.fraudAssessment.create({
    data: {
      claimId: claim1.id,
      fraudScore: 10.0,
      flag: FraudFlag.NORMAL,
      explanation: 'Claim appears normal.',
    },
  });

  await prisma.fraudAssessment.create({
    data: {
      claimId: claim2.id,
      fraudScore: 80.0,
      flag: FraudFlag.SUSPICIOUS,
      explanation: 'Flagged due to high claim amount and suspicious keywords.',
    },
  });

  // 8. Create Recommendations
  await prisma.recommendation.create({
    data: {
      userId: customer1.id,
      recommendedProducts: ['HomeSafe Property', 'Apex Complete Health'],
      explanation: 'Recommended based on reported life events and age.',
    },
  });

  await prisma.recommendation.create({
    data: {
      userId: customer2.id,
      recommendedProducts: ['Apex Term Life', 'SafeDrive Auto'],
      explanation: 'Recommended 2 products based on age 45.',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
