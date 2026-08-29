import React from 'react';

interface ConfidenceTagProps {
  score?: number;
  className?: string;
}

export const ConfidenceTag: React.FC<ConfidenceTagProps> = ({
  score = 1.0,
  className = '',
}) => {
  const percentage = Math.round(score * 100);

  let colorClasses = 'bg-[#EAF5EF] text-[#2D7A58] border-[#D0EADB]';
  let level = 'High link confidence';

  if (score < 0.6) {
    colorClasses = 'bg-[#FEF6E9] text-[#9C6644] border-[#FCE4BE]';
    level = 'Moderate link confidence';
  } else if (score < 0.3) {
    colorClasses = 'bg-[#F5EFE6] text-[#7D7268] border-[#E5DACB]';
    level = 'Insufficient evidence';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{level} ({percentage}%)</span>
    </div>
  );
};

export default ConfidenceTag;
