import AgentWorkspace from './AgentWorkspace';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAgentData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const [appsRes, claimsRes] = await Promise.all([
      fetch(`${API_URL}/applications`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
      fetch(`${API_URL}/claims`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
    ]);

    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];

    return { applications, claims };
  } catch {
    return { applications: [], claims: [] };
  }
}

export default async function AgentDashboardPage() {
  const { applications, claims } = await getAgentData();
  return <AgentWorkspace initialApplications={applications} initialClaims={claims} />;
}
