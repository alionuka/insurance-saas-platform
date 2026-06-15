'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useT } from '@/i18n/LocaleProvider';

type DataPoint = { date: string; count: number };

const COLORS: Record<string, { stroke: string; fill: string }> = {
  // Royal-blue brand stroke + warm accents — all readable on white.
  blue: { stroke: '#003da5', fill: '#003da5' },
  emerald: { stroke: '#059669', fill: '#10b981' },
  rose: { stroke: '#e11d48', fill: '#fb7185' },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400">{payload[0].value} events</p>
    </div>
  );
};

export default function ActivityLineChart({ data, title, color = 'blue' }: { data: DataPoint[]; title?: string; color?: string }) {
  const { t } = useT();
  const palette = COLORS[color] ?? COLORS.blue;

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md flex flex-col items-center justify-center min-h-[280px]">
        {title && <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">{title}</h3>}
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('finale.noActivityData')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
      {title && <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">{title}</h3>}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette.fill} stopOpacity={0.2} />
                <stop offset="95%" stopColor={palette.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={palette.stroke}
              strokeWidth={2}
              fill={`url(#gradient-${color})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
