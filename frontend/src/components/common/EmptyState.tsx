import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No entities or links match the active search criteria.',
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto ${className}`}>
      <div className="p-4 rounded-2xl bg-brand-border/40 text-brand-muted mb-4">
        {icon || <Search className="w-8 h-8 text-brand-muted" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-brand-muted mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-purple text-white text-xs font-medium rounded-lg hover:bg-brand-purple-light transition-all shadow-md shadow-brand-purple/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
