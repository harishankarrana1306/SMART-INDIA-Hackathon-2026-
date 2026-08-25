import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading investigative network intelligence...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center space-y-3 ${className}`}>
      <div className="relative">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        <div className="absolute inset-0 blur-md bg-brand-purple/30 rounded-full animate-pulse" />
      </div>
      <p className="text-sm font-medium text-brand-muted">{message}</p>
    </div>
  );
};

export default LoadingState;
