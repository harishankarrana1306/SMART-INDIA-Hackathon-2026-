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
          ? 'bg-[#1C1917]/95 border-[#DDA15E]/30 text-[#DDA15E] backdrop-blur-md'
          : 'bg-[#FEF6E9] border-[#FCE4BE] text-[#7F4F24]'
      } ${className}`}
    >
      <AlertTriangle className="w-4 h-4 text-[#DDA15E] flex-shrink-0" />
      <span className="tracking-wide text-[11px]">
        <strong>Decision-support only.</strong> Not a determination of guilt or risk. All findings require human investigator review.
      </span>
    </div>
  );
};

export default DisclaimerBanner;
