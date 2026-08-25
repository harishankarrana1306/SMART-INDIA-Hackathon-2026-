import React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'purple' | 'indigo' | 'green' | 'amber' | 'red' | 'blue' | 'teal' | 'slate' | 'sky';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'purple',
  size = 'sm',
  className = '',
}) => {
  const variantStyles: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-rose-100 text-rose-800 border-rose-200',
    blue: 'bg-sky-100 text-sky-800 border-sky-200',
    sky: 'bg-sky-100 text-sky-800 border-sky-200',
    teal: 'bg-teal-100 text-teal-800 border-teal-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${variantStyles[variant] || variantStyles.purple} ${sizeStyles[size]} ${className}`}
    >
      {label}
    </span>
  );
};

export default Badge;
