import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.log('Usage: npm run create:user -- <email> <password> <firstName> <lastName> <role> [companyId]');
    process.exit(1);
  }

  const [email, password, firstName, lastName, roleStr, companyId] = args;

  // 1. Validate Role
  const role = roleStr as UserRole;
  if (!Object.values(UserRole).includes(role)) {
    console.error(`Error: Invalid role "${roleStr}". Must be one of: ${Object.values(UserRole).join(', ')}`);
    process.exit(1);
  }

  // 2. Validate Password Length
  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  // 3. COMPANY_ADMIN validation
  if (role === UserRole.COMPANY_ADMIN && !companyId) {
    console.error('Error: companyId is required for role COMPANY_ADMIN');
    process.exit(1);
  }

  try {
    // 4. Verify Company exists if provided
    let finalCompanyId: string | null = null;
    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        console.error(`Error: Company with ID "${companyId}" not found`);
        process.exit(1);
      }
      if (role === UserRole.COMPANY_ADMIN) {
        finalCompanyId = companyId;
      }
    }

    // 5. Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.error(`Error: User with email "${email}" already exists`);
      process.exit(1);
    }

    // 6. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 7. Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        companyId: finalCompanyId,
      },
    });

    console.log('User created successfully:');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Company ID: ${user.companyId || 'null'}`);

  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
