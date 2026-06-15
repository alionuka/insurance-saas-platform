'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useT } from '@/i18n/LocaleProvider';

export type FeatureContribution = {
  feature: string;
  value: number | string;
  contribution: number;
};

const CustomTooltip = ({ active, payload }: any) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useT();
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const sign = data.contribution >= 0 ? '+' : '';
  return (
    <div className="bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-2xl text-left">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{data.feature}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
        {t('finale.valueColon')} <span className="text-slate-800 dark:text-slate-200 font-medium font-mono">{data.value}</span>
      </p>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Impact:{' '}
        <span className={data.contribution >= 0 ? 'text-rose-400 font-bold font-mono' : 'text-emerald-400 font-bold font-mono'}>
          {sign}{data.contribution.toFixed(2)}%
        </span>
      </p>
    </div>
  );
};

export default function RiskContributionsChart({ contributions }: { contributions: FeatureContribution[] }) {
  const { t } = useT();
  if (!contributions || contributions.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('finale.noContribExplain')}</p>
      </div>
    );
  }

  // Sort by abs(contribution) DESC to display most important on top, but BarChart renders from bottom-up or top-down depending on layouts.
  // Recharts horizontal bar chart renders top item first when index is 0 if we order it appropriately.
  const chartData = [...contributions].reverse().map((c) => ({
    feature: c.feature,
    value: c.value,
    contribution: c.contribution,
  }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 15, left: -25, bottom: 5 }}
        >
          <CartesianGrid stroke="#1f1f22" strokeDasharray="3 3" horizontal={false} vertical={true} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fontSize: 10, fill: '#d4d4d8', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
          <ReferenceLine x={0} stroke="#3f3f46" strokeWidth={1} />
          <Bar dataKey="contribution" radius={4} barSize={12}>
            {chartData.map((entry, index) => {
              const isPositive = entry.contribution >= 0;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isPositive ? '#fb7185' : '#34d399'}
                  fillOpacity={0.85}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
