import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DisclaimerBannerProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  className = '',
  variant = 'dark',
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      className={`w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2.5 text-xs font-medium border shadow-sm transition-all ${
        isDark
          ? 'bg-[#111322]/95 border-amber-500/30 text-amber-300 backdrop-blur-md'
          : 'bg-amber-50/90 border-amber-200 text-amber-900'
      } ${className}`}
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <span className="tracking-wide">
        <strong>Decision-support only.</strong> Not a determination of guilt or risk. All findings require human investigator review.
      </span>
    </div>
  );
};

export default DisclaimerBanner;
