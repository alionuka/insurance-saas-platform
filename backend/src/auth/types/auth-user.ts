import { UserRole } from '@prisma/client';

export class AuthUser {
  id: string;
  role: UserRole;
  companyId: string | null;
}
