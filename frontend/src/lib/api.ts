const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Company {
  id: string;
  name: string;
  description: string;
}

export interface InsuranceProduct {
  id: string;
  name: string;
  type: string;
  description: string;
  companyId: string;
  company: Company;
}

export async function getProducts(): Promise<InsuranceProduct[]> {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}
