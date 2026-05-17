import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient, UserRole, PolicyStatus } from '@prisma/client';
import { PaymentsService } from '../src/payments/payments.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let paymentsService: PaymentsService;
  const suffix = randomUUID().substring(0, 8);

  const ids = {
    companyId: '',
    productId: '',
    customer1: '',
    customer2: '',
    agent: '',
    appId: '',
    policyId: '',
  };

  const tokens = {
    customer1: '',
    customer2: '',
    agent: '',
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

    // Retrieve PaymentsService and override the private readonly `stripe`
    // client with a mock — cast through any because we deliberately replace
    // a private readonly field for testing purposes.
    paymentsService = moduleFixture.get<PaymentsService>(PaymentsService);
    (paymentsService as any).stripe = {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: 'cs_test_mock_id',
            url: 'https://checkout.stripe.com/test_session_url',
          }),
        },
      },
    };

    // 1. Create Company
    const company = await prisma.company.create({
      data: { name: `Payments Company ${suffix}`, description: 'Test Company Payments' },
    });
    ids.companyId = company.id;

    // 2. Create Product
    const product = await prisma.insuranceProduct.create({
      data: { name: `Payments Product ${suffix}`, type: 'AUTO', companyId: company.id, basePremium: 500 },
    });
    ids.productId = product.id;

    // 3. Create Users
    const hashedPassword = await bcrypt.hash(passwords.default, 10);
    const usersData = [
      { email: `payments-customer1-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer1' },
      { email: `payments-customer2-${suffix}@test.local`, role: UserRole.CUSTOMER, key: 'customer2' },
      { email: `payments-agent-${suffix}@test.local`, role: UserRole.AGENT, key: 'agent' },
    ];

    for (const u of usersData) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hashedPassword,
          firstName: 'Payments',
          lastName: u.role,
          role: u.role,
          companyId: null,
        },
      });
      (ids as any)[u.key] = created.id;

      // Log in
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

    // 5. Create Policy (status PENDING_PAYMENT)
    const policy = await prisma.policy.create({
      data: {
        policyNumber: `pol-pay-${suffix}`,
        userId: ids.customer1,
        productId: ids.productId,
        applicationId: ids.appId,
        status: PolicyStatus.PENDING_PAYMENT,
        premiumAmount: 800,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    ids.policyId = policy.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.payment.deleteMany({ where: { policyId: ids.policyId } }).catch(() => null);
      await prisma.policy.deleteMany({ where: { id: ids.policyId } }).catch(() => null);
      await prisma.application.deleteMany({ where: { id: ids.appId } }).catch(() => null);
      await prisma.user.deleteMany({ where: { email: { startsWith: 'payments-', contains: suffix } } }).catch(() => null);
      await prisma.insuranceProduct.deleteMany({ where: { id: ids.productId } }).catch(() => null);
      await prisma.company.deleteMany({ where: { id: ids.companyId } }).catch(() => null);
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /policies/:id/checkout', () => {
    it('should let customer1 (owner) initiate Stripe checkout with amount 800', async () => {
      const res = await request(app.getHttpServer())
        .post(`/policies/${ids.policyId}/checkout`)
        .set('Authorization', `Bearer ${tokens.customer1}`);
      
      expect(res.status).toBe(201);
      expect(res.body.url).toBe('https://checkout.stripe.com/test_session_url');

      // Assert StripeService / Stripe API checkout sessions create was called once with amount = 800 * 100
      expect(paymentsService['stripe'].checkout.sessions.create).toHaveBeenCalledTimes(1);
      const mockCallArgs = (paymentsService['stripe'].checkout.sessions.create as jest.Mock).mock.calls[0][0];
      expect(mockCallArgs.line_items[0].price_data.unit_amount).toBe(80000);
      expect(mockCallArgs.line_items[0].price_data.currency).toBe('usd');
    });

    it('should return 403 for customer2 (not owner)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/policies/${ids.policyId}/checkout`)
        .set('Authorization', `Bearer ${tokens.customer2}`);
      
      expect(res.status).toBe(403);
    });

    it('should return 403 for agent (not owner, only customer role allowed)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/policies/${ids.policyId}/checkout`)
        .set('Authorization', `Bearer ${tokens.agent}`);
      
      expect(res.status).toBe(403);
    });

    it('should return 401 for anonymous access', async () => {
      const res = await request(app.getHttpServer())
        .post(`/policies/${ids.policyId}/checkout`);
      
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent policy UUID', async () => {
      const res = await request(app.getHttpServer())
        .post(`/policies/${randomUUID()}/checkout`)
        .set('Authorization', `Bearer ${tokens.customer1}`);
      
      expect(res.status).toBe(404);
    });
  });
});
