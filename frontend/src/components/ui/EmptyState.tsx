import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="border border-slate-200/50 border-dashed rounded-2xl py-16 px-8 flex flex-col items-center justify-center text-center">
      <div className="bg-blue-700/10 p-4 rounded-full mb-4">
        <Icon className="h-8 w-8 text-blue-700 stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 max-w-sm mb-6">{description}</p>
      {action && (
        <Link href={action.href} className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-slate-900 rounded-lg font-medium transition-colors">
          {action.label}
        </Link>
      )}
    </div>
  );
}
