"use client";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function FilterPills({ options, value, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive 
                ? 'bg-blue-700 text-white' 
                : 'bg-white text-slate-600 hover:text-white hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
