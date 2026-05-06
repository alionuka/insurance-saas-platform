import AgentWorkspace from './AgentWorkspace';

async function getAgentData() {
  try {
    const [appsRes, claimsRes] = await Promise.all([
      fetch('http://localhost:3001/applications', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/claims', { cache: 'no-store' }).catch(() => null),
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
