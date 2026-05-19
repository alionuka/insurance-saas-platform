import QuoteCalculator from '@/components/QuoteCalculator';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function ClientQuotePage() {
  const products = await getProducts();
  const { t } = await getT();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{t('clientQuote.title')}</h1>
        <p className="text-zinc-400 mt-1 text-sm">{t('clientQuote.subtitle')}</p>
      </div>

      <QuoteCalculator products={products} />
    </div>
  );
}
