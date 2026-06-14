import RecommendedProducts from '@/components/RecommendedProducts';
import { getT } from '@/i18n/getT';

export default async function ClientRecommendationsPage() {
  const { t } = await getT();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('clientRecs.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">{t('clientRecs.subtitle')}</p>
      </div>

      <RecommendedProducts />
    </div>
  );
}
