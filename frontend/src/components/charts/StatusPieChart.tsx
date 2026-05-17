'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type PieData = { name: string; value: number; color: string };

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-white">{data.name}</p>
      <p className="text-xs text-zinc-400">{data.value} items</p>
    </div>
  );
};

export default function StatusPieChart({ data, title }: { data: PieData[]; title?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col items-center justify-center min-h-[280px]">
        {title && <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{title}</h3>}
        <p className="text-sm text-zinc-600">No data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
      {title && <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{title}</h3>}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-zinc-400 font-medium">{d.name} <span className="text-zinc-500">({d.value})</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
