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
  'attendance.check_in': 'ثبت ورود',
  'attendance.check_out': 'ثبت خروج',
  'finance.create': 'ثبت مالی',
  'finance.update': 'ویرایش مالی',
  'finance.refund': 'استرداد',
  'transaction.create': 'ثبت تراکنش',
  'transaction.update': 'ویرایش تراکنش',
  'transaction.delete': 'حذف تراکنش',
  'payment.create': 'ثبت پرداخت',
  'payment.update': 'ویرایش پرداخت',
  'refund.create': 'ثبت استرداد',
  'single_session.create': 'ثبت جلسه تکی',
  'single_session.update': 'ویرایش جلسه تکی',
  'single_session.delete': 'حذف جلسه تکی',
  'singlesession.create': 'ثبت جلسه تکی',
  'singlesession.update': 'ویرایش جلسه تکی',
  'singlesession.delete': 'حذف جلسه تکی',
  'session.create': 'ثبت جلسه',
  'session.update': 'ویرایش جلسه',
  'session.delete': 'حذف جلسه',
  'ticket.create': 'ثبت تیکت',
  'ticket.update': 'ویرایش تیکت',
  'ticket.reply': 'پاسخ تیکت',
  'gym.update': 'ویرایش باشگاه',
  'settings.update': 'ویرایش تنظیمات',
  login: 'ورود',
  logout: 'خروج',
};

const ENTITY_LABELS: Record<string, string> = {
  customer: 'عضو',
  member: 'عضو',
  course: 'دوره',
  offering: 'خدمت',
  employee: 'کارمند',
  coach: 'مربی',
  price: 'قیمت',
  attendance: 'حضور',
  finance: 'مالی',
  transaction: 'تراکنش',
  payment: 'پرداخت',
  refund: 'استرداد',
  single_session: 'جلسه تکی',
  singlesession: 'جلسه تکی',
  session: 'جلسه',
  ticket: 'تیکت',
  gym: 'باشگاه',
  user: 'کاربر',
  settings: 'تنظیمات',
};

const OBJECT_TYPE_LABELS: Record<string, string> = {
  Course: 'دوره',
  CourseEnrollment: 'ثبت‌نام دوره',
  GymOffering: 'خدمت / رشته',
  Offering: 'خدمت / رشته',
  GymStaffAccess: 'دسترسی کارمند',
  StaffAccess: 'دسترسی کارمند',
  GymCustomer: 'عضو',
  GymMember: 'عضو',
  Customer: 'عضو',
  Member: 'عضو',
  GymCoach: 'مربی',
  Coach: 'مربی',
  GymPrice: 'قیمت',
  Price: 'قیمت',
  GymVisit: 'حضور',
  Visit: 'حضور',
  Attendance: 'حضور',
  FinanceTransaction: 'تراکنش مالی',
  Transaction: 'تراکنش مالی',
  CustomerPayment: 'پرداخت',
  Payment: 'پرداخت',
  Refund: 'استرداد',
  SingleSession: 'جلسه تکی',
  SingleSessionPurchase: 'جلسه تکی',
  Session: 'جلسه',
  GymChangeRequest: 'تیکت',
  Ticket: 'تیکت',
  Gym: 'باشگاه',
  User: 'کاربر',
};

function actionLabel(action?: string | null) {
  if (!action) return '—';
  const raw = String(action).trim();
  const normalized = raw.replace(/-/g, '_').replace(/\s+/g, '_').toLowerCase();
  if (ACTION_LABELS[raw]) return ACTION_LABELS[raw];
  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized];

  const verbs: Record<string, string> = {
    create: 'ایجاد',
    update: 'ویرایش',
    delete: 'حذف',
    enroll: 'ثبت‌نام',
    view: 'مشاهده',
    check_in: 'ثبت ورود',
    check_out: 'ثبت خروج',
    reply: 'پاسخ',
    refund: 'استرداد',
  };

  if (normalized.includes('.')) {
    const parts = normalized.split('.');
    const verb = parts[parts.length - 1];
    const entity = parts.slice(0, -1).join('_');
    const entityFa = ENTITY_LABELS[entity] || ENTITY_LABELS[parts[0]] || entity.replace(/_/g, ' ');
    const verbFa = verbs[verb] || verb;
    if (verbs[verb]) return `${verbFa} ${entityFa}`;
    return `${entityFa} ${verbFa}`;
  }

  for (const [v, vFa] of Object.entries(verbs)) {
    if (normalized.endsWith('_' + v) || normalized.endsWith(v)) {
      const entity = normalized.replace(new RegExp('_?' + v + '$'), '');
      const entityFa = ENTITY_LABELS[entity] || entity.replace(/_/g, ' ');
      return `${vFa} ${entityFa}`;
    }
  }

  if (ENTITY_LABELS[normalized]) return ENTITY_LABELS[normalized];

  return raw;
}

function objectTypeLabel(t?: string | null) {
  if (!t) return '—';
  if (OBJECT_TYPE_LABELS[t]) return OBJECT_TYPE_LABELS[t];
  const pascal = String(t)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  if (OBJECT_TYPE_LABELS[pascal]) return OBJECT_TYPE_LABELS[pascal];
  const lower = String(t).toLowerCase().replace(/-/g, '_');
  if (ENTITY_LABELS[lower]) return ENTITY_LABELS[lower];
  return t;
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
      setItems(list || []);
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
      const u = String(r.user_name || '').toLowerCase();
      const repr = String(r.object_repr || '').toLowerCase();
      return a.includes(q) || o.includes(q) || u.includes(q) || repr.includes(q) || String(r.action || '').toLowerCase().includes(q);
    });
  }, [items, search]);

  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'عملیات', render: (r) => <span className="text-ink text-sm font-medium">{actionLabel(r.action)}</span> },
    { key: 'object_type', header: 'نوع', render: (r) => <span className="text-sm text-muted">{objectTypeLabel(r.object_type)}</span> },
    { key: 'object_repr', header: 'مورد', render: (r) => <span className="text-sm text-ink truncate max-w-[14rem] inline-block">{objectLabel(r)}</span> },
    { key: 'user_name', header: 'کاربر', render: (r) => <span className="text-sm text-muted">{r.user_name || '—'}</span> },
    { key: 'created_at', header: 'زمان', render: (r) => <span className="text-xs text-muted tabular-nums">{r.created_at ? formatJalaliDateTime(r.created_at) : '—'}</span> },
  ];

  if (!hasGym) return <NoGymSelected />;

  return (
    <div className="space-y-4">
      <Header
        title="گزارش فعالیت"
        subtitle="سابقه اقدامات انجام‌شده در پنل باشگاه"
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover"
          >
            بروزرسانی
          </button>
        }
      />

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجو در عملیات، نوع یا کاربر..."
        className="w-full sm:max-w-md rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />

      {error && <ErrorBlock message={error} onRetry={load} />}

      {loading ? (
        <LoadingBlock />
      ) : !error && filtered.length === 0 ? (
        <EmptyState title="فعالیتی ثبت نشده" description={items.length ? 'با جستجوی فعلی نتیجه‌ای نیست.' : 'هنوز رویدادی از اقدامات ثبت نشده است.'} />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={false} />
      )}
    </div>
  );
};

export default AuditLogsPage;
