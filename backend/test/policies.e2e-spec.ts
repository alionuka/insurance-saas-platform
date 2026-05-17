import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient, UserRole, PolicyStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

describe('Policies (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = randomUUID().substring(0, 8);

  const ids = {
    companyA: '',
    companyB: '',
    productA: '',
    productB: '',
    customer1: '',
    customer2: '',
    companyAdminA: '',
    companyAdminB: '',
    agent: '',
    platformAdmin: '',
    appA: '',
    appB: '',
    policyA: '',
    policyB: '',
  };

  const tokens = {
    customer1: '',
    customer2: '',
    companyAdminA: '',
    companyAdminB: '',
    agent: '',
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

    // 1. Create 2 Companies
    const companyA = await prisma.company.create({
      data: { name: `Policies Company A ${suffix}`, description: 'Test Company A' },
    });
    const companyB = await prisma.company.create({
      data: { name: `Policies Company B ${suffix}`, description: 'Test Company B' },
    });
    ids.companyA = companyA.id;
    ids.companyB = companyB.id;

    // 2. Create 2 Products
    const productA = await prisma.insuranceProduct.create({
      data: { name: `Policies Product A ${suffix}`, type: 'AUTO', companyId: companyA.id, basePremium: 300 },
    });
    const productB = await prisma.insuranceProduct.create({
      data: { name: `Policies Product B ${suffix}`, type: 'HEALTH', companyId: companyB.id, basePremium: 400 },
    });
    ids.productA = productA.id;
    ids.productB = productB.id;

    // 3. Create Users
    const hashedPassword = await bcrypt.hash(passwords.default, 10);
    const usersData = [
      { email: `policies-customer1-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer1' },
      { email: `policies-customer2-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer2' },
      { email: `policies-ca-a-${suffix}@test.local`, role: UserRole.COMPANY_ADMIN, companyId: companyA.id, key: 'companyAdminA' },
      { email: `policies-ca-b-${suffix}@test.local`, role: UserRole.COMPANY_ADMIN, companyId: companyB.id, key: 'companyAdminB' },
      { email: `policies-agent-${suffix}@test.local`, role: UserRole.AGENT, key: 'agent' },
      { email: `policies-p-admin-${suffix}@test.local`, role: UserRole.PLATFORM_ADMIN, key: 'platformAdmin' },
    ];

    for (const u of usersData) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hashedPassword,
          firstName: 'Policies',
          lastName: u.role,
          role: u.role,
          companyId: u.companyId || null,
        },
      });
      (ids as any)[u.key] = created.id;

      // Get Tokens
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: u.email, password: passwords.default });
      (tokens as any)[u.key] = loginRes.body.access_token;
    }

    // 4. Create Applications
    const appA = await prisma.application.create({
      data: { userId: ids.customer1, productId: ids.productA, status: 'APPROVED' },
    });
    const appB = await prisma.application.create({
      data: { userId: ids.customer2, productId: ids.productB, status: 'APPROVED' },
    });
    ids.appA = appA.id;
    ids.appB = appB.id;

    // 5. Create 2 Policies
    const policyA = await prisma.policy.create({
      data: {
        policyNumber: `pol-a-${suffix}`,
        userId: ids.customer1,
        productId: ids.productA,
        applicationId: ids.appA,
        status: PolicyStatus.ACTIVE,
        premiumAmount: 600,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    const policyB = await prisma.policy.create({
      data: {
        policyNumber: `pol-b-${suffix}`,
        userId: ids.customer2,
        productId: ids.productB,
        applicationId: ids.appB,
        status: PolicyStatus.ACTIVE,
        premiumAmount: 900,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    ids.policyA = policyA.id;
    ids.policyB = policyB.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.policy.deleteMany({ where: { id: { in: [ids.policyA, ids.policyB] } } }).catch(() => null);
      await prisma.application.deleteMany({ where: { id: { in: [ids.appA, ids.appB] } } }).catch(() => null);
      await prisma.user.deleteMany({ where: { email: { startsWith: 'policies-', contains: suffix } } }).catch(() => null);
      await prisma.insuranceProduct.deleteMany({ where: { id: { in: [ids.productA, ids.productB] } } }).catch(() => null);
      await prisma.company.deleteMany({ where: { id: { in: [ids.companyA, ids.companyB] } } }).catch(() => null);
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('GET /policies', () => {
    it('should let customer1 see only policyA', async () => {
      const res = await request(app.getHttpServer())
        .get('/policies')
        .set('Authorization', `Bearer ${tokens.customer1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.some((p: any) => p.id === ids.policyA)).toBe(true);
      expect(res.body.items.some((p: any) => p.id === ids.policyB)).toBe(false);
    });

    it('should let customer2 see only policyB', async () => {
      const res = await request(app.getHttpServer())
        .get('/policies')
        .set('Authorization', `Bearer ${tokens.customer2}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.some((p: any) => p.id === ids.policyA)).toBe(false);
      expect(res.body.items.some((p: any) => p.id === ids.policyB)).toBe(true);
    });

    it('should let agent see both policies', async () => {
      const res = await request(app.getHttpServer())
        .get('/policies')
        .set('Authorization', `Bearer ${tokens.agent}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items.some((p: any) => p.id === ids.policyA)).toBe(true);
      expect(res.body.items.some((p: any) => p.id === ids.policyB)).toBe(true);
    });

    it('should let platformAdmin see both policies', async () => {
      const res = await request(app.getHttpServer())
        .get('/policies')
        .set('Authorization', `Bearer ${tokens.platformAdmin}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items.some((p: any) => p.id === ids.policyA)).toBe(true);
      expect(res.body.items.some((p: any) => p.id === ids.policyB)).toBe(true);
    });

    it('should let companyAdminA see only policyA (filtered by product companyId)', async () => {
      const res = await request(app.getHttpServer())
        .get('/policies')
        .set('Authorization', `Bearer ${tokens.companyAdminA}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items.some((p: any) => p.id === ids.policyA)).toBe(true);
      expect(res.body.items.some((p: any) => p.id === ids.policyB)).toBe(false);
    });

    it('should let companyAdminB see only policyB (filtered by product companyId)', async () => {
      const res = await request(app.getHttpServer())
        .get('/policies')
        .set('Authorization', `Bearer ${tokens.companyAdminB}`);
      
      expect(res.status).toBe(200);
      expect(res.body.items.some((p: any) => p.id === ids.policyA)).toBe(false);
      expect(res.body.items.some((p: any) => p.id === ids.policyB)).toBe(true);
    });

    it('should return 401 for anonymous access', async () => {
      const res = await request(app.getHttpServer()).get('/policies');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /policies/:id', () => {
    it('should let customer1 read policyA containing detailed data', async () => {
      const res = await request(app.getHttpServer())
        .get(`/policies/${ids.policyA}`)
        .set('Authorization', `Bearer ${tokens.customer1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.policyNumber).toBe(`pol-a-${suffix}`);
      expect(res.body.premiumAmount).toBe(600);
      expect(res.body.product).toBeDefined();
      expect(res.body.product.id).toBe(ids.productA);
    });

    it('should return 403 for customer1 reading policyB', async () => {
      const res = await request(app.getHttpServer())
        .get(`/policies/${ids.policyB}`)
        .set('Authorization', `Bearer ${tokens.customer1}`);
      
      expect(res.status).toBe(403);
    });

    it('should let companyAdminA read policyA', async () => {
      const res = await request(app.getHttpServer())
        .get(`/policies/${ids.policyA}`)
        .set('Authorization', `Bearer ${tokens.companyAdminA}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ids.policyA);
    });

    it('should return 403 for companyAdminA reading policyB', async () => {
      const res = await request(app.getHttpServer())
        .get(`/policies/${ids.policyB}`)
        .set('Authorization', `Bearer ${tokens.companyAdminA}`);
      
      expect(res.status).toBe(403);
    });

    it('should let agent read both policyA and policyB', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/policies/${ids.policyA}`)
        .set('Authorization', `Bearer ${tokens.agent}`);
      expect(resA.status).toBe(200);

      const resB = await request(app.getHttpServer())
        .get(`/policies/${ids.policyB}`)
        .set('Authorization', `Bearer ${tokens.agent}`);
      expect(resB.status).toBe(200);
    });

    it('should return 404 for non-existent policy UUID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/policies/${randomUUID()}`)
        .set('Authorization', `Bearer ${tokens.agent}`);
      expect(res.status).toBe(404);
    });
  });
});
