'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';

type BulkAction = {
  label: string;
  variant: 'primary' | 'success' | 'danger' | 'warning';
  onClick: () => void;
  icon: React.ElementType;
};

// All bulk-action buttons render white text on a saturated background.
// Variants pick the brand role: primary = royal navy, success = forest
// green, danger = burgundy red, warning = amber.
const variantClasses: Record<string, string> = {
  primary: 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
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
  const { t } = useT();
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4"
        >
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {selectedCount} selected
            </span>
            <button
              onClick={onClearSelection}
              className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              title={t('finale.clearSelection')}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Actions */}
          {isProcessing ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
              {t('finale.processing')}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${variantClasses[action.variant]}`}
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
