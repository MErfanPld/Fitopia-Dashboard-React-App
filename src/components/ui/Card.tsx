import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}> = ({ children, className = '', padding = true }) => (
  <div className={`bg-surface border border-line rounded-2xl shadow-sm ${padding ? 'p-5' : ''} ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);
