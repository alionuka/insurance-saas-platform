import RecommendedProducts from '@/components/RecommendedProducts';
import { getT } from '@/i18n/getT';

export default async function ClientRecommendationsPage() {
  const { t } = await getT();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{t('clientRecs.title')}</h1>
        <p className="text-zinc-400 mt-1 text-sm">{t('clientRecs.subtitle')}</p>
      </div>

      <RecommendedProducts />
    </div>
  );
}
