import React from 'react';
import { Badge } from '../ui/Badge';

const map: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' }> = {
  active: { label: 'فعال', tone: 'success' },
  inactive: { label: 'غیرفعال', tone: 'neutral' },
  paid: { label: 'پرداخت شده', tone: 'success' },
  pending: { label: 'در انتظار', tone: 'warning' },
  cancelled: { label: 'لغو شده', tone: 'danger' },
  canceled: { label: 'لغو شده', tone: 'danger' },
  completed: { label: 'تکمیل شده', tone: 'success' },
  rejected: { label: 'رد شده', tone: 'danger' },
  open: { label: 'باز', tone: 'info' },
  closed: { label: 'بسته', tone: 'neutral' },
  in_progress: { label: 'در حال بررسی', tone: 'warning' },
  success: { label: 'موفق', tone: 'success' },
  failed: { label: 'ناموفق', tone: 'danger' },
};

export const StatusBadge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const key = (status || '').toLowerCase();
  const entry = map[key];
  return <Badge tone={entry?.tone || 'neutral'}>{label || entry?.label || status}</Badge>;
};
