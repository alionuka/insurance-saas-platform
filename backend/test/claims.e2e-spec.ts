import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient, UserRole, PolicyStatus, ClaimStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

describe('Claims (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = randomUUID().substring(0, 8);

  const ids = {
    companyId: '',
    productId: '',
    customer1: '',
    customer2: '',
    agent: '',
    companyAdmin: '',
    platformAdmin: '',
    appId: '',
    policyId: '',
    claimId: '',
  };

  const tokens = {
    customer1: '',
    customer2: '',
    agent: '',
    companyAdmin: '',
    platformAdmin: '',
  };

  const passwords = {
    default: 'password123',
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    // 1. Create Company
    const company = await prisma.company.create({
      data: { name: `Claims Company ${suffix}`, description: 'Test Company Claims' },
    });
    ids.companyId = company.id;

    // 2. Create Product
    const product = await prisma.insuranceProduct.create({
      data: { name: `Claims Product ${suffix}`, type: 'HEALTH', companyId: company.id, basePremium: 200 },
    });
    ids.productId = product.id;

    // 3. Create Users
    const hashedPassword = await bcrypt.hash(passwords.default, 10);
    const usersData = [
      { email: `claims-customer1-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer1' },
      { email: `claims-customer2-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer2' },
      { email: `claims-agent-${suffix}@test.local`, role: UserRole.AGENT, key: 'agent' },
      { email: `claims-ca-${suffix}@test.local`, role: UserRole.COMPANY_ADMIN, companyId: company.id, key: 'companyAdmin' },
      { email: `claims-p-admin-${suffix}@test.local`, role: UserRole.PLATFORM_ADMIN, key: 'platformAdmin' },
    ];

    for (const u of usersData) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hashedPassword,
          firstName: 'Claims',
          lastName: u.role,
          role: u.role,
          companyId: u.companyId || null,
        },
      });
      (ids as any)[u.key] = created.id;

      // Log in to get tokens
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: u.email, password: passwords.default });
      (tokens as any)[u.key] = loginRes.body.access_token;
    }

    // 4. Create Application (status APPROVED)
    const application = await prisma.application.create({
      data: { userId: ids.customer1, productId: ids.productId, status: 'APPROVED' },
    });
    ids.appId = application.id;

    // 5. Create Policy (status ACTIVE)
    const policy = await prisma.policy.create({
      data: {
        policyNumber: `pol-claims-${suffix}`,
        userId: ids.customer1,
        productId: ids.productId,
        applicationId: ids.appId,
        status: PolicyStatus.ACTIVE,
        premiumAmount: 500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year
      },
    });
    ids.policyId = policy.id;
  });

  afterAll(async () => {
    if (prisma) {
      // Cleanup in reverse order
      if (ids.claimId) {
        await prisma.fraudAssessment.deleteMany({ where: { claimId: ids.claimId } }).catch(() => null);
        await prisma.claim.deleteMany({ where: { id: ids.claimId } }).catch(() => null);
      }
      await prisma.claim.deleteMany({ where: { userId: { in: [ids.customer1, ids.customer2] } } }).catch(() => null);
      await prisma.policy.deleteMany({ where: { id: ids.policyId } }).catch(() => null);
      await prisma.application.deleteMany({ where: { id: ids.appId } }).catch(() => null);
      await prisma.user.deleteMany({ where: { email: { startsWith: 'claims-', contains: suffix } } }).catch(() => null);
      await prisma.insuranceProduct.deleteMany({ where: { id: ids.productId } }).catch(() => null);
      await prisma.company.deleteMany({ where: { id: ids.companyId } }).catch(() => null);
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /claims', () => {
    it('should let customer1 create a claim on their own policy and verify FraudAssessment is created', async () => {
      const res = await request(app.getHttpServer())
        .post('/claims')
        .set('Authorization', `Bearer ${tokens.customer1}`)
        .send({
          policyId: ids.policyId,
          amount: 1000,
          description: 'broken windshield',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe(ClaimStatus.FILED);
      ids.claimId = res.body.id;

      // Query Prisma to verify the fraud assessment was auto-created
      const fraudAssessment = await prisma.fraudAssessment.findFirst({
        where: { claimId: ids.claimId },
      });
      expect(fraudAssessment).toBeDefined();
      expect(fraudAssessment?.fraudScore).toBeDefined();
      expect(fraudAssessment?.flag).toBeDefined();
    });

    it('should prevent customer2 from creating a claim on customer1 policy', async () => {
      const res = await request(app.getHttpServer())
        .post('/claims')
        .set('Authorization', `Bearer ${tokens.customer2}`)
        .send({
          policyId: ids.policyId,
          amount: 1000,
          description: 'another claims test',
        });
      expect(res.status).toBe(403);
    });

    it('should reject with 401 if token is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/claims')
        .send({
          policyId: ids.policyId,
          amount: 1000,
          description: 'broken windshield',
        });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /claims', () => {
    it('should let customer1 see only their own claim', async () => {
      const res = await request(app.getHttpServer())
        .get('/claims')
        .set('Authorization', `Bearer ${tokens.customer1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      const allMine = res.body.items.every((c: any) => c.userId === ids.customer1);
      expect(allMine).toBe(true);
      expect(res.body.items.some((c: any) => c.id === ids.claimId)).toBe(true);
    });

    it('should let customer2 see no claims (empty array)', async () => {
      const res = await request(app.getHttpServer())
        .get('/claims')
        .set('Authorization', `Bearer ${tokens.customer2}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });

    it('should let agent see all claims', async () => {
      const res = await request(app.getHttpServer())
        .get('/claims')
        .set('Authorization', `Bearer ${tokens.agent}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should let platformAdmin see all claims', async () => {
      const res = await request(app.getHttpServer())
        .get('/claims')
        .set('Authorization', `Bearer ${tokens.platformAdmin}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should let companyAdmin see only claims against their product', async () => {
      const res = await request(app.getHttpServer())
        .get('/claims')
        .set('Authorization', `Bearer ${tokens.companyAdmin}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      const allAgainstCompany = res.body.items.every(
        (c: any) => c.application?.product?.companyId === ids.companyId
      );
      expect(allAgainstCompany).toBe(true);
    });
  });

  describe('GET /claims/:id', () => {
    it('should let customer1 see their claim with fraudAssessments included', async () => {
      const res = await request(app.getHttpServer())
        .get(`/claims/${ids.claimId}`)
        .set('Authorization', `Bearer ${tokens.customer1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ids.claimId);
      expect(res.body.fraudAssessments).toBeDefined();
      expect(res.body.fraudAssessments.length).toBeGreaterThanOrEqual(1);
    });

    it('should prevent customer2 from seeing customer1 claim', async () => {
      const res = await request(app.getHttpServer())
        .get(`/claims/${ids.claimId}`)
        .set('Authorization', `Bearer ${tokens.customer2}`);
      
      expect(res.status).toBe(403);
    });

    it('should let agent see the claim', async () => {
      const res = await request(app.getHttpServer())
        .get(`/claims/${ids.claimId}`)
        .set('Authorization', `Bearer ${tokens.agent}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ids.claimId);
    });
  });

  describe('PATCH /claims/:id/status', () => {
    it('should let agent PATCH to IN_PROGRESS', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/claims/${ids.claimId}/status`)
        .set('Authorization', `Bearer ${tokens.agent}`)
        .send({ status: ClaimStatus.IN_PROGRESS });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ClaimStatus.IN_PROGRESS);
    });

    it('should let agent PATCH to APPROVED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/claims/${ids.claimId}/status`)
        .set('Authorization', `Bearer ${tokens.agent}`)
        .send({ status: ClaimStatus.APPROVED });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ClaimStatus.APPROVED);
    });

    it('should prevent customer1 from patching status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/claims/${ids.claimId}/status`)
        .set('Authorization', `Bearer ${tokens.customer1}`)
        .send({ status: ClaimStatus.APPROVED });
      
      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid status string', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/claims/${ids.claimId}/status`)
        .set('Authorization', `Bearer ${tokens.agent}`)
        .send({ status: 'INVALID_STATUS' });
      
      expect(res.status).toBe(400);
    });
  });
});
