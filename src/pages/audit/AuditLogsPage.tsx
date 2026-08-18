import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import auditService from '../../services/audit/auditService';
import type { AuditLog } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

const ACTION_LABELS: Record<string, string> = {
  'customer.create': 'ایجاد عضو',
  'customer.update': 'ویرایش عضو',
  'customer.delete': 'حذف عضو',
  'course.create': 'ایجاد دوره',
  'course.update': 'ویرایش دوره',
  'course.delete': 'حذف دوره',
  'course.enroll': 'ثبت‌نام در دوره',
  'offering.create': 'ایجاد خدمت',
  'offering.update': 'ویرایش خدمت',
  'offering.delete': 'حذف خدمت',
  'employee.create': 'افزودن کارمند',
  'employee.update': 'ویرایش کارمند',
  'employee.delete': 'حذف کارمند',
  'coach.create': 'افزودن مربی',
  'coach.update': 'ویرایش مربی',
  'coach.delete': 'حذف مربی',
  'price.create': 'ثبت قیمت',
  'price.update': 'ویرایش قیمت',
  'price.delete': 'حذف قیمت',
  'attendance.create': 'ثبت حضور',
  'attendance.update': 'ویرایش حضور',
  'finance.create': 'ثبت مالی',
  'finance.update': 'ویرایش مالی',
  'finance.refund': 'استرداد',
  'ticket.create': 'ثبت تیکت',
  'ticket.reply': 'پاسخ تیکت',
  'gym.update': 'ویرایش باشگاه',
  login: 'ورود',
  logout: 'خروج',
};

const OBJECT_TYPE_LABELS: Record<string, string> = {
  Course: 'دوره',
  CourseEnrollment: 'ثبت‌نام دوره',
  GymOffering: 'خدمت / رشته',
  GymStaffAccess: 'دسترسی کارمند',
  GymCustomer: 'عضو',
  GymMember: 'عضو',
  GymCoach: 'مربی',
  GymPrice: 'قیمت',
  GymVisit: 'حضور',
  FinanceTransaction: 'تراکنش مالی',
  CustomerPayment: 'پرداخت',
  Refund: 'استرداد',
  GymChangeRequest: 'تیکت',
  Ticket: 'تیکت',
  Gym: 'باشگاه',
  User: 'کاربر',
};

function actionLabel(action?: string | null) {
  if (!action) return '—';
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const parts = action.split('.');
  if (parts.length === 2) {
    const verbs: Record<string, string> = {
      create: 'ایجاد',
      update: 'ویرایش',
      delete: 'حذف',
      enroll: 'ثبت‌نام',
      view: 'مشاهده',
    };
    return `${verbs[parts[1]] || parts[1]} ${parts[0]}`;
  }
  return action;
}

function objectTypeLabel(t?: string | null) {
  if (!t) return '—';
  return OBJECT_TYPE_LABELS[t] || t;
}

function objectLabel(r: AuditLog) {
  if (r.object_repr) return r.object_repr;
  return objectTypeLabel(r.object_type);
}

export const AuditLogsPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await auditService.list(gymId);
      setItems((list || []).filter((x) => x && x.id != null));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت گزارش فعالیت');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym) load();
  }, [hasGym, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const a = actionLabel(r.action).toLowerCase();
      const o = objectTypeLabel(r.object_type).toLowerCase();
      const u = (r.user_name || 'سیستم').toLowerCase();
      const repr = String(r.object_repr || '').toLowerCase();
      return a.includes(q) || o.includes(q) || u.includes(q) || repr.includes(q) || String(r.action || '').toLowerCase().includes(q);
    });
  }, [items, search]);

  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'عملیات', render: (r) => <span className="text-ink text-sm font-medium">{actionLabel(r.action)}</span> },
    { key: 'user_name', header: 'کاربر', render: (r) => <span className="text-secondary text-sm">{r.user_name || 'سیستم'}</span> },
    { key: 'object_type', header: 'نوع', render: (r) => <span className="text-secondary text-sm">{objectTypeLabel(r.object_type)}</span> },
    { key: 'object_id', header: 'مورد', render: (r) => <span className="text-muted text-xs">{objectLabel(r)}</span> },
    {
      key: 'created_at',
      header: 'زمان',
      render: (r) => (
        <span className="text-muted text-xs tabular-nums">{r.created_at ? formatJalaliDateTime(r.created_at) : '—'}</span>
      ),
    },
  ];

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="گزارش فعالیت" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header title="گزارش فعالیت" subtitle="سابقه عملیات انجام‌شده در باشگاه" onQuickAction={load} quickActionLabel="بروزرسانی" />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجو در عملیات، کاربر یا نوع..."
        className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
      {loading && !items.length && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="رکوردی یافت نشد" description={items.length ? 'با جستجوی فعلی نتیجه‌ای نیست.' : 'هنوز فعالیتی ثبت نشده است.'} />
      )}
      {!error && filtered.length > 0 && (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}
    </div>
  );
};

export default AuditLogsPage;
