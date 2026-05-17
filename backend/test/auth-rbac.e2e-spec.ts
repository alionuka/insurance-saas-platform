import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = randomUUID().substring(0, 8);

  // Fixture IDs and tokens
  const ids = {
    companyA: '',
    companyB: '',
    productA: '',
    productB: '',
    customer1: '',
    customer2: '',
    agent: '',
    companyAdminA: '',
    companyAdminB: '',
    platformAdmin: '',
    appA: '',
    appB: '',
    newAdminId: '',
  };

  const tokens = {
    customer1: '',
    customer2: '',
    agent: '',
    companyAdminA: '',
    companyAdminB: '',
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

    // 1. Create Companies
    const companyA = await prisma.company.create({
      data: { name: `E2E Company A ${suffix}`, description: 'Test Company A' },
    });
    const companyB = await prisma.company.create({
      data: { name: `E2E Company B ${suffix}`, description: 'Test Company B' },
    });
    ids.companyA = companyA.id;
    ids.companyB = companyB.id;

    // 2. Create Products
    const productA = await prisma.insuranceProduct.create({
      data: { name: `E2E Product A ${suffix}`, type: 'HEALTH', companyId: companyA.id },
    });
    const productB = await prisma.insuranceProduct.create({
      data: { name: `E2E Product B ${suffix}`, type: 'AUTO', companyId: companyB.id },
    });
    ids.productA = productA.id;
    ids.productB = productB.id;

    // 3. Create Users
    const hashedPassword = await bcrypt.hash(passwords.default, 10);
    
    const usersData = [
      { email: `e2e-customer1-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer1' },
      { email: `e2e-customer2-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer2' },
      { email: `e2e-agent-${suffix}@test.local`, role: UserRole.AGENT, key: 'agent' },
      { email: `e2e-ca-a-${suffix}@test.local`, role: UserRole.COMPANY_ADMIN, companyId: companyA.id, key: 'companyAdminA' },
      { email: `e2e-ca-b-${suffix}@test.local`, role: UserRole.COMPANY_ADMIN, companyId: companyB.id, key: 'companyAdminB' },
      { email: `e2e-p-admin-${suffix}@test.local`, role: UserRole.PLATFORM_ADMIN, key: 'platformAdmin' },
    ];

    for (const u of usersData) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hashedPassword,
          firstName: 'E2E',
          lastName: u.role,
          role: u.role,
          companyId: u.companyId || null,
        },
      });
      (ids as any)[u.key] = created.id;

      // 4. Get Tokens
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: u.email, password: passwords.default });
      (tokens as any)[u.key] = loginRes.body.access_token;
    }

    // 5. Create Applications
    const appA = await prisma.application.create({
      data: { userId: ids.customer1, productId: ids.productA, status: 'PENDING' },
    });
    const appB = await prisma.application.create({
      data: { userId: ids.customer2, productId: ids.productB, status: 'PENDING' },
    });
    ids.appA = appA.id;
    ids.appB = appB.id;
  });

  afterAll(async () => {
    // Cleanup in reverse order
    if (prisma) {
      const e2eEmailPattern = `e2e-%-${suffix}@test.local`;
      
      // Delete generated admin user if exists
      if (ids.newAdminId) {
        await prisma.user.delete({ where: { id: ids.newAdminId } }).catch(() => null);
      }

      await prisma.application.deleteMany({ where: { OR: [{ userId: ids.customer1 }, { userId: ids.customer2 }] } });
      await prisma.insuranceProduct.deleteMany({ where: { id: { in: [ids.productA, ids.productB] } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e-', contains: suffix } } });
      await prisma.company.deleteMany({ where: { id: { in: [ids.companyA, ids.companyB] } } });
      
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new customer with role CUSTOMER', async () => {
      const email = `e2e-reg-${randomUUID().substring(0, 4)}-${suffix}@test.local`;
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'newpassword123',
          firstName: 'New',
          lastName: 'User',
          age: 25,
        });
      
      expect(res.status).toBe(201);
      expect(res.body.role).toBe(UserRole.CUSTOMER);
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should force role CUSTOMER even if role PLATFORM_ADMIN is provided', async () => {
      const email = `e2e-reg-force-${randomUUID().substring(0, 4)}-${suffix}@test.local`;
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'newpassword123',
          firstName: 'Force',
          lastName: 'Role',
          age: 25,
          role: 'PLATFORM_ADMIN', // Attempting to escalate
        } as any);
      
      expect(res.status).toBe(201);
      expect(res.body.role).toBe(UserRole.CUSTOMER);
    });

    it('should return 400 for password shorter than 8 chars', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'short@test.local',
          password: 'short',
          firstName: 'Short',
          lastName: 'Pass',
          age: 25,
        });
      expect(res.status).toBe(400);
    });

    it('should return 400 if email is already in use', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `e2e-customer1-${suffix}@test.local`,
          password: 'password123',
          firstName: 'Dup',
          lastName: 'User',
          age: 25,
        });
      expect(res.status).toBe(409); // Note: AuthService throws ConflictException (409) for duplicates
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `e2e-customer1-${suffix}@test.local`,
          password: passwords.default,
        });
      expect(res.status).toBe(201); // login returns 201 by default in Nest for POST
      expect(res.body.access_token).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `e2e-customer1-${suffix}@test.local`,
          password: 'wrongpassword',
        });
      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.local',
          password: 'somepassword',
        });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /applications RBAC', () => {
    it('should return 401 for missing token', async () => {
      const res = await request(app.getHttpServer()).get('/applications');
      expect(res.status).toBe(401);
    });

    it('should let customer1 see only their own application', async () => {
      const res = await request(app.getHttpServer())
        .get('/applications')
        .set('Authorization', `Bearer ${tokens.customer1}`);
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(ids.appA);
    });

    it('should let customer2 see only their own application', async () => {
      const res = await request(app.getHttpServer())
        .get('/applications')
        .set('Authorization', `Bearer ${tokens.customer2}`);
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(ids.appB);
    });

    it('should let agent see all applications', async () => {
      const res = await request(app.getHttpServer())
        .get('/applications')
        .set('Authorization', `Bearer ${tokens.agent}`);
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should let platformAdmin see all applications', async () => {
      const res = await request(app.getHttpServer())
        .get('/applications')
        .set('Authorization', `Bearer ${tokens.platformAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should let companyAdminA see only apps from companyA', async () => {
      const res = await request(app.getHttpServer())
        .get('/applications')
        .set('Authorization', `Bearer ${tokens.companyAdminA}`);
      expect(res.status).toBe(200);
      const allCompanyA = res.body.items.every((app: any) => app.product.companyId === ids.companyA);
      expect(allCompanyA).toBe(true);
    });

    it('should let companyAdminB see only apps from companyB', async () => {
      const res = await request(app.getHttpServer())
        .get('/applications')
        .set('Authorization', `Bearer ${tokens.companyAdminB}`);
      expect(res.status).toBe(200);
      const allCompanyB = res.body.items.every((app: any) => app.product.companyId === ids.companyB);
      expect(allCompanyB).toBe(true);
    });
  });

  describe('GET /applications/:id ownership and scoping', () => {
    it('should let customer1 read appA', async () => {
      const res = await request(app.getHttpServer())
        .get(`/applications/${ids.appA}`)
        .set('Authorization', `Bearer ${tokens.customer1}`);
      expect(res.status).toBe(200);
    });

    it('should deny customer1 from reading appB', async () => {
      const res = await request(app.getHttpServer())
        .get(`/applications/${ids.appB}`)
        .set('Authorization', `Bearer ${tokens.customer1}`);
      expect(res.status).toBe(403);
    });

    it('should let companyAdminA read appA', async () => {
      const res = await request(app.getHttpServer())
        .get(`/applications/${ids.appA}`)
        .set('Authorization', `Bearer ${tokens.companyAdminA}`);
      expect(res.status).toBe(200);
    });

    it('should deny companyAdminA from reading appB', async () => {
      const res = await request(app.getHttpServer())
        .get(`/applications/${ids.appB}`)
        .set('Authorization', `Bearer ${tokens.companyAdminA}`);
      expect(res.status).toBe(403);
    });

    it('should let agent read both', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/applications/${ids.appA}`)
        .set('Authorization', `Bearer ${tokens.agent}`);
      const resB = await request(app.getHttpServer())
        .get(`/applications/${ids.appB}`)
        .set('Authorization', `Bearer ${tokens.agent}`);
      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
    });

    it('should let platformAdmin read both', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/applications/${ids.appA}`)
        .set('Authorization', `Bearer ${tokens.platformAdmin}`);
      const resB = await request(app.getHttpServer())
        .get(`/applications/${ids.appB}`)
        .set('Authorization', `Bearer ${tokens.platformAdmin}`);
      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
    });
  });

  describe('POST /admin/users', () => {
    it('should return 401 for missing token', async () => {
      const res = await request(app.getHttpServer()).post('/admin/users');
      expect(res.status).toBe(401);
    });

    it('should return 403 for CUSTOMER', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${tokens.customer1}`)
        .send({ email: 'test@test.com', role: 'AGENT' });
      expect(res.status).toBe(403);
    });

    it('should return 403 for AGENT', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${tokens.agent}`)
        .send({ email: 'test@test.com', role: 'AGENT' });
      expect(res.status).toBe(403);
    });

    it('should return 403 for COMPANY_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${tokens.companyAdminA}`)
        .send({ email: 'test@test.com', role: 'AGENT' });
      expect(res.status).toBe(403);
    });

    it('should let platformAdmin create an AGENT', async () => {
      const email = `e2e-new-agent-${suffix}@test.local`;
      const res = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${tokens.platformAdmin}`)
        .send({
          email,
          password: 'password123',
          firstName: 'New',
          lastName: 'Agent',
          role: 'AGENT',
        });
      
      expect(res.status).toBe(201);
      expect(res.body.role).toBe('AGENT');
      expect(res.body.passwordHash).toBeUndefined();
      ids.newAdminId = res.body.id;
    });

    it('should return 400 for COMPANY_ADMIN without companyId', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${tokens.platformAdmin}`)
        .send({
          email: `e2e-fail-ca-${suffix}@test.local`,
          password: 'password123',
          firstName: 'Fail',
          lastName: 'CA',
          role: 'COMPANY_ADMIN',
        });
      expect(res.status).toBe(400);
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${tokens.platformAdmin}`)
        .send({
          email: `e2e-customer1-${suffix}@test.local`,
          password: 'password123',
          firstName: 'Dup',
          lastName: 'Admin',
          role: 'AGENT',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /auth/me', () => {
    it('should update profile name and demographics for customer1', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${tokens.customer1}`)
        .send({
          firstName: 'UpdatedAlice',
          lastName: 'UpdatedSmith',
          age: 35,
          annualIncome: 95000,
          creditScore: 780,
        });

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe('UpdatedAlice');
      expect(res.body.lastName).toBe('UpdatedSmith');
      expect(res.body.age).toBe(35);
      expect(res.body.annualIncome).toBe(95000);
      expect(res.body.creditScore).toBe(780);

      // Verify audit log exists
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'PROFILE_UPDATED',
          actorId: ids.customer1,
        },
      });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].metadata).toBeDefined();
      const metadata = logs[0].metadata as any;
      expect(metadata.changedFields).toContain('firstName');
      expect(metadata.changedFields).toContain('lastName');
      expect(metadata.changedFields).toContain('age');
      expect(metadata.changedFields).toContain('annualIncome');
      expect(metadata.changedFields).toContain('creditScore');
    });

    it('should return 400 for invalid inputs', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${tokens.customer1}`)
        .send({
          age: 12, // too young (min 18)
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/me')
        .send({
          firstName: 'NoToken',
        });

      expect(res.status).toBe(401);
    });
  });
});
