/**
 * Reusable Prisma select for User fields that are safe to return in API responses.
 * Excludes passwordHash to prevent leaking credentials.
 */
export const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  age: true,
  annualIncome: true,
  creditScore: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
} as const;
