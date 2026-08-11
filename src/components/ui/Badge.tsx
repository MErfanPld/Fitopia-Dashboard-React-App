import React from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const tones: Record<Tone, string> = {
  neutral: 'bg-canvas text-muted border-line',
  success: 'bg-green-50 text-success border-green-200',
  warning: 'bg-amber-50 text-warning border-amber-200',
  danger: 'bg-red-50 text-danger border-red-200',
  info: 'bg-blue-50 text-info border-blue-200',
  primary: 'bg-primary/10 text-primary border-primary/20',
};

export const Badge: React.FC<{
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}> = ({ children, tone = 'neutral', className = '' }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${tones[tone]} ${className}`}>
    {children}
  </span>
);
