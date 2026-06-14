'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert } from 'lucide-react';

export type FraudDriver = {
  feature: string;
  totalImpact: number;
  occurrences: number;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-2xl text-left">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{data.feature}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
        Cumulative impact: <span className="text-rose-700 dark:text-rose-400 font-mono font-bold">{data.totalImpact.toFixed(1)} pts</span>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Across {data.occurrences} claim assessment{data.occurrences === 1 ? '' : 's'}
      </p>
    </div>
  );
};

export default function TopFraudDriversChart({ drivers }: { drivers: FraudDriver[] }) {
  if (!drivers || drivers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-full">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="h-5 w-5 text-rose-700 dark:text-rose-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Top Fraud Drivers</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Aggregated fraud feature contributions across all claims</p>
        <div className="flex items-center justify-center h-[220px] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-sm text-slate-500 dark:text-slate-400">No fraud assessments yet.</p>
        </div>
      </div>
    );
  }

  const chartData = [...drivers].reverse();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-full">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="h-5 w-5 text-rose-700 dark:text-rose-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Top Fraud Drivers</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Cumulative fraud feature impact (SHAP) across all claim assessments</p>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid stroke="#1f1f22" strokeDasharray="3 3" horizontal={false} vertical={true} />
            <XAxis
              type="number"
              tick={{ fontSize: 9, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(0)}`}
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
            <Bar dataKey="totalImpact" radius={4} barSize={14}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill="#fb7185" fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
