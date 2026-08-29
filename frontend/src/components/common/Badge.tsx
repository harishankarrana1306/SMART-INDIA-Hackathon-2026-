import React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'purple' | 'indigo' | 'green' | 'amber' | 'red' | 'blue' | 'teal' | 'slate' | 'sky' | 'cognac';
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
    purple: 'bg-[#F3ECF8] text-[#7B5294] border-[#E3D4ED]',
    indigo: 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]',
    green: 'bg-[#EAF5EF] text-[#2D7A58] border-[#D0EADB]',
    amber: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    red: 'bg-[#FCEEED] text-[#C24134] border-[#F8D5D2]',
    blue: 'bg-[#EBF2FA] text-[#4A6FA5] border-[#D4E3F5]',
    sky: 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]',
    teal: 'bg-[#CCFBF1] text-[#0D9488] border-[#99F6E4]',
    slate: 'bg-[#F5EFE6] text-[#5C5248] border-[#E5DACB]',
    cognac: 'bg-[#9C6644]/10 text-[#9C6644] border-[#9C6644]/25',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${variantStyles[variant] || variantStyles.purple} ${sizeStyles[size]} ${className}`}
    >
      {label}
    </span>
  );
};

export default Badge;
