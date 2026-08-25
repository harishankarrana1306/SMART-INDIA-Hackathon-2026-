import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorVariant?: 'purple' | 'indigo' | 'green' | 'amber' | 'blue';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorVariant = 'purple',
  onClick,
}) => {
  const colorMap = {
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      iconBg: 'bg-purple-100/80',
      iconColor: 'text-brand-purple',
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-100/80',
      iconColor: 'text-brand-indigo',
    },
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100/80',
      iconColor: 'text-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100/80',
      iconColor: 'text-amber-600',
    },
    blue: {
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      iconBg: 'bg-sky-100/80',
      iconColor: 'text-sky-600',
    },
  };

  const scheme = colorMap[colorVariant];

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-brand-purple/40' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className={`w-5 h-5 ${scheme.iconColor}`} />
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
      </div>
      {subtitle && (
        <p className="text-xs text-brand-muted mt-1.5 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
