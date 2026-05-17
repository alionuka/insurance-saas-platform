'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type DataPoint = { date: string; count: number };

const COLORS: Record<string, { stroke: string; fill: string }> = {
  indigo: { stroke: '#818cf8', fill: '#818cf8' },
  emerald: { stroke: '#34d399', fill: '#34d399' },
  rose: { stroke: '#fb7185', fill: '#fb7185' },
  amber: { stroke: '#fbbf24', fill: '#fbbf24' },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-white">{label}</p>
      <p className="text-xs text-zinc-400">{payload[0].value} events</p>
    </div>
  );
};

export default function ActivityLineChart({ data, title, color = 'indigo' }: { data: DataPoint[]; title?: string; color?: string }) {
  const palette = COLORS[color] ?? COLORS.indigo;

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col items-center justify-center min-h-[280px]">
        {title && <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{title}</h3>}
        <p className="text-sm text-zinc-600">No activity data available</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
      {title && <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{title}</h3>}
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
              stroke="#27272a"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: '#71717a' }}
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
