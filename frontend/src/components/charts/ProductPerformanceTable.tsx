import { Package, TrendingUp, TrendingDown } from 'lucide-react';

export type ProductRow = {
  productId: string;
  productName: string;
  productType: string;
  appsCount: number;
  policiesActive: number;
  premiumRevenue: number;
  claimsCount: number;
  approvedClaims: number;
  claimsRatio: number; // approvedClaims / policiesActive
};

const TYPE_COLOR: Record<string, string> = {
  AUTO: 'text-blue-400',
  HEALTH: 'text-emerald-400',
  LIFE: 'text-purple-400',
  PROPERTY: 'text-amber-400',
  TRAVEL: 'text-rose-400',
};

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export default function ProductPerformanceTable({ rows }: { rows: ProductRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Performance per Product</h3>
        </div>
        <p className="text-sm text-zinc-500 mt-4">No products to compare yet.</p>
      </div>
    );
  }

  // Sort by revenue desc
  const sorted = [...rows].sort((a, b) => b.premiumRevenue - a.premiumRevenue);
  const maxRevenue = Math.max(...sorted.map((r) => r.premiumRevenue), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Performance per Product</h3>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Revenue, in-force policies, and claim experience — ranked by premium revenue
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3 text-right">Apps</th>
              <th className="px-6 py-3 text-right">Active Policies</th>
              <th className="px-6 py-3 text-right">Revenue</th>
              <th className="px-6 py-3 text-right">Claims</th>
              <th className="px-6 py-3 text-right">Loss Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sorted.map((row) => {
              const lossRatio = row.claimsRatio;
              const ratioColor =
                lossRatio === 0 ? 'text-zinc-500'
                : lossRatio < 0.2 ? 'text-emerald-400'
                : lossRatio < 0.5 ? 'text-amber-400'
                : 'text-rose-400';
              const revenuePct = (row.premiumRevenue / maxRevenue) * 100;
              return (
                <tr key={row.productId} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white text-sm">{row.productName}</p>
                    <span className={`text-[9px] uppercase font-bold tracking-wider ${TYPE_COLOR[row.productType] ?? 'text-zinc-400'}`}>
                      {row.productType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-zinc-300">{row.appsCount}</td>
                  <td className="px-6 py-4 text-right font-mono text-zinc-300">{row.policiesActive}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex flex-col items-end gap-1">
                      <span className="font-bold text-emerald-400 font-mono">{formatCurrency(row.premiumRevenue)}</span>
                      <div className="w-24 h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${revenuePct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-zinc-300">{row.approvedClaims}</span>
                    <span className="text-[10px] text-zinc-600 font-mono ml-1">/{row.claimsCount}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {lossRatio > 0 && (lossRatio >= 0.5 ? (
                        <TrendingUp className="h-3 w-3 text-rose-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-emerald-400" />
                      ))}
                      <span className={`font-mono font-bold ${ratioColor}`}>
                        {(lossRatio * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
