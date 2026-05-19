const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Company {
  id: string;
  name: string;
  description: string;
  // Per-tenant branding fields — populated once a COMPANY_ADMIN saves them
  // via /companies/me. Always optional from the consumer's side.
  logoUrl?: string | null;
  primaryColor?: string | null;
}

export interface InsuranceProduct {
  id: string;
  name: string;
  type: string;
  description: string;
  companyId: string;
  company: Company;
  basePremium: number;
}

export async function getProducts(): Promise<InsuranceProduct[]> {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  return data.items ?? [];
}
