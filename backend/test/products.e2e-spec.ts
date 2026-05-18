import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

describe('Products E2E & Actions Scoping (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = randomUUID().substring(0, 8);

  const ids = {
    companyA: '',
    companyB: '',
    productA1: '',
    productA2: '',
    productB: '',
    customer: '',
    adminA: '',
    adminB: '',
    platformAdmin: '',
    appId: '',
  };

  const tokens = {
    customer: '',
    adminA: '',
    adminB: '',
    platformAdmin: '',
  };

  const passwords = {
    default: 'Password123!',
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
      data: { name: `Products Co A ${suffix}`, description: 'Co A' },
    });
    const companyB = await prisma.company.create({
      data: { name: `Products Co B ${suffix}`, description: 'Co B' },
    });
    ids.companyA = companyA.id;
    ids.companyB = companyB.id;

    // 2. Create Products
    const productA1 = await prisma.insuranceProduct.create({
      data: { name: `Product A1 ${suffix}`, type: 'LIFE', companyId: companyA.id, basePremium: 100 },
    });
    const productA2 = await prisma.insuranceProduct.create({
      data: { name: `Product A2 ${suffix}`, type: 'AUTO', companyId: companyA.id, basePremium: 200 },
    });
    const productB = await prisma.insuranceProduct.create({
      data: { name: `Product B1 ${suffix}`, type: 'HEALTH', companyId: companyB.id, basePremium: 300 },
    });
    ids.productA1 = productA1.id;
    ids.productA2 = productA2.id;
    ids.productB = productB.id;

    // 3. Create Users
    const hashedPassword = await bcrypt.hash(passwords.default, 10);
    const usersData = [
      { email: `p-customer-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer' },
      { email: `p-adminA-${suffix}@test.local`, role: UserRole.COMPANY_ADMIN, companyId: companyA.id, key: 'adminA' },
      { email: `p-adminB-${suffix}@test.local`, role: UserRole.COMPANY_ADMIN, companyId: companyB.id, key: 'adminB' },
      { email: `p-platform-${suffix}@test.local`, role: UserRole.PLATFORM_ADMIN, key: 'platformAdmin' },
    ];

    for (const u of usersData) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hashedPassword,
          firstName: 'ProdTest',
          lastName: u.role,
          role: u.role,
          companyId: u.companyId || null,
        },
      });
      (ids as any)[u.key] = created.id;

      // Log in
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: u.email, password: passwords.default });
      (tokens as any)[u.key] = loginRes.body.access_token;
    }

    // 4. Link productA2 to an application (so it can't be deleted)
    const application = await prisma.application.create({
      data: { userId: ids.customer, productId: ids.productA2, status: 'PENDING' },
    });
    ids.appId = application.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.application.deleteMany({ where: { id: ids.appId } }).catch(() => null);
      await prisma.insuranceProduct.deleteMany({ where: { id: { in: [ids.productA1, ids.productA2, ids.productB] } } }).catch(() => null);
      await prisma.user.deleteMany({ where: { email: { startsWith: 'p-', contains: suffix } } }).catch(() => null);
      await prisma.company.deleteMany({ where: { id: { in: [ids.companyA, ids.companyB] } } }).catch(() => null);
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('PATCH /products/:id', () => {
    it('should allow COMPANY_ADMIN from same company to edit product', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/products/${ids.productA1}`)
        .set('Authorization', `Bearer ${tokens.adminA}`)
        .send({
          name: 'Updated Product A1',
          basePremium: 150,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Product A1');
      expect(res.body.basePremium).toBe(150);

      // Verify audit logs
      const audit = await prisma.auditLog.findMany({
        where: {
          action: 'PRODUCT_UPDATED',
          resourceId: ids.productA1,
        },
      });
      expect(audit.length).toBeGreaterThan(0);
      expect((audit[0].metadata as any).changedFields).toContain('name');
      expect((audit[0].metadata as any).changedFields).toContain('basePremium');
    });

    it('should refuse edit for COMPANY_ADMIN from another company', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/products/${ids.productA1}`)
        .set('Authorization', `Bearer ${tokens.adminB}`)
        .send({
          name: 'Hacked Name',
        });

      expect(res.status).toBe(403);
    });

    it('should refuse edit for CUSTOMER', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/products/${ids.productA1}`)
        .set('Authorization', `Bearer ${tokens.customer}`)
        .send({
          name: 'Customer Hack',
        });

      expect(res.status).toBe(403);
    });

    it('should allow PLATFORM_ADMIN to edit product', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/products/${ids.productA1}`)
        .set('Authorization', `Bearer ${tokens.platformAdmin}`)
        .send({
          description: 'Updated by Platform Admin',
        });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated by Platform Admin');
    });
  });

  describe('DELETE /products/:id', () => {
    it('should refuse delete for COMPANY_ADMIN from another company', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/products/${ids.productA1}`)
        .set('Authorization', `Bearer ${tokens.adminB}`);

      expect(res.status).toBe(403);
    });

    it('should refuse delete for CUSTOMER', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/products/${ids.productA1}`)
        .set('Authorization', `Bearer ${tokens.customer}`);

      expect(res.status).toBe(403);
    });

    it('should refuse delete if product has linked applications (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/products/${ids.productA2}`)
        .set('Authorization', `Bearer ${tokens.adminA}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Cannot delete: product has 1 applications');
    });

    it('should allow COMPANY_ADMIN from same company to delete product with 0 references', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/products/${ids.productA1}`)
        .set('Authorization', `Bearer ${tokens.adminA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify audit logs
      const audit = await prisma.auditLog.findMany({
        where: {
          action: 'PRODUCT_DELETED',
          resourceId: ids.productA1,
        },
      });
      expect(audit.length).toBeGreaterThan(0);
      expect((audit[0].metadata as any).name).toContain('Product A1');
    });
  });
});
