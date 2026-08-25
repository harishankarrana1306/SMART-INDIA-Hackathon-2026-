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

  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let level = 'High link confidence';

  if (score < 0.6) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    level = 'Moderate link confidence';
  } else if (score < 0.3) {
    colorClasses = 'bg-slate-50 text-slate-700 border-slate-200';
    level = 'Insufficient evidence';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span>{level} ({percentage}%)</span>
    </div>
  );
};

export default ConfidenceTag;
