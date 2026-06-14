'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

type BulkAction = {
  label: string;
  variant: 'primary' | 'success' | 'danger' | 'warning';
  onClick: () => void;
  icon: React.ElementType;
};

const variantClasses: Record<string, string> = {
  primary: 'bg-blue-700 hover:bg-blue-600 shadow-blue-500/20',
  success: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20',
  danger: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20',
  warning: 'bg-blue-700 hover:bg-blue-600 shadow-blue-500/20 text-black',
};

export default function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  isProcessing = false,
}: {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  isProcessing?: boolean;
}) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4"
        >
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
            <span className="text-sm font-bold text-slate-900">
              {selectedCount} selected
            </span>
            <button
              onClick={onClearSelection}
              className="h-5 w-5 rounded-full bg-slate-100 hover:bg-zinc-700 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Actions */}
          {isProcessing ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 shadow-lg transition-colors ${variantClasses[action.variant]}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
