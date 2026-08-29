import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorVariant?: 'blue' | 'green' | 'purple' | 'red' | 'amber' | 'cognac';
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorVariant = 'blue',
  trend = '+12.5%',
  onClick,
}) => {
  const colorMap = {
    blue: {
      cardBg: 'bg-[#F4F8FD]',
      border: 'border-[#D9E6F5]',
      iconBg: 'bg-[#2563EB]',
      trendColor: 'text-emerald-700',
    },
    green: {
      cardBg: 'bg-[#F2F9F5]',
      border: 'border-[#D2EADB]',
      iconBg: 'bg-[#059669]',
      trendColor: 'text-emerald-700',
    },
    purple: {
      cardBg: 'bg-[#F7F3FB]',
      border: 'border-[#E6DAF3]',
      iconBg: 'bg-[#7C3AED]',
      trendColor: 'text-emerald-700',
    },
    red: {
      cardBg: 'bg-[#FCF4F4]',
      border: 'border-[#F8D8D8]',
      iconBg: 'bg-[#DC2626]',
      trendColor: 'text-emerald-700',
    },
    amber: {
      cardBg: 'bg-[#FBF6EE]',
      border: 'border-[#F2E3CA]',
      iconBg: 'bg-[#D97706]',
      trendColor: 'text-emerald-700',
    },
    cognac: {
      cardBg: 'bg-[#F9F5EE]',
      border: 'border-[#E8DAC7]',
      iconBg: 'bg-[#8A5A36]',
      trendColor: 'text-emerald-700',
    },
  };

  const scheme = colorMap[colorVariant] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl ${scheme.cardBg} border ${scheme.border} transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        boxShadow:
          '0 10px 25px -5px rgba(45, 30, 15, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#6E6359]">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-full ${scheme.iconBg} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-0.5">
        <span className="text-2xl font-black text-[#20150F] tracking-tight">
          {value}
        </span>
        {trend && (
          <div className="flex items-center text-[11px] font-bold text-emerald-700">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-[#7D7065] mt-1 font-medium truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
