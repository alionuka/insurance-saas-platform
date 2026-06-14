'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

export type FeatureContribution = {
  feature: string;
  value: number | string;
  contribution: number;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const sign = data.contribution >= 0 ? '+' : '';
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xl text-left">
      <p className="text-xs font-bold text-slate-900">{data.feature}</p>
      <p className="text-xs text-slate-600 mt-1">
        Value: <span className="text-slate-800 font-medium font-mono">{data.value}</span>
      </p>
      <p className="text-xs text-slate-600">
        Impact:{' '}
        <span className={data.contribution >= 0 ? 'text-rose-400 font-bold font-mono' : 'text-emerald-400 font-bold font-mono'}>
          {sign}{data.contribution.toFixed(2)}%
        </span>
      </p>
      <p className="text-[10px] text-slate-500 mt-1">
        {data.contribution >= 0 ? 'Raises fraud likelihood' : 'Lowers fraud likelihood'}
      </p>
    </div>
  );
};

export default function FraudContributionsChart({ contributions }: { contributions: FeatureContribution[] }) {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl">
        <p className="text-xs text-slate-500">No fraud contributions available.</p>
      </div>
    );
  }

  // Sort by abs(contribution) DESC to display most important on top.
  const chartData = [...contributions].reverse().map((c) => ({
    feature: c.feature,
    value: c.value,
    contribution: c.contribution,
  }));

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
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
            width={120}
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
