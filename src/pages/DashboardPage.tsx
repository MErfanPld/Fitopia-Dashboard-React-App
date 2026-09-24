import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardCheck,
  Wallet,
  UserCheck,
  Dumbbell,
  BookOpen,
  Layers,
  UserPlus,
  Plus,
  CalendarCheck,
  CreditCard,
  ArrowLeft,
  KeyRound,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Ticket,
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { StatCard } from '../components/common/StatCard';
import { ErrorBlock, LoadingBlock, NoGymSelected } from '../components/common/EmptyState';
import { useGymScoped } from '../hooks/useGymScoped';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import membersService from '../services/members/membersService';
import coachesService from '../services/coaches/coachesService';
import employeesService from '../services/employees/employeesService';
import attendanceService from '../services/attendance/attendanceService';
import financeService from '../services/finance/financeService';
import coursesService from '../services/courses/coursesService';
import offeringsService from '../services/offerings/offeringsService';
import tokensService, {
  type TokenLookupResult,
  type TokenTodayEntry,
} from '../services/tokens/tokensService';
import type { AttendanceStats, FinanceReport } from '../types/api';
import { formatJalaliDateTime } from '../utils/jalaliUtils';

interface DashStats {
  members: number | null;
  coaches: number | null;
  employees: number | null;
  courses: number | null;
  offerings: number | null;
  attendance: AttendanceStats | null;
  finance: FinanceReport | null;
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('fa-IR');
}

function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}

function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    active: 'فعال',
    used: 'مصرف‌شده',
    expired: 'منقضی',
    revoked: 'باطل',
    pending: 'در انتظار',
  };
  if (!status) return '—';
  return map[status] || status;
}

export const DashboardPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped();
  const { currentGym, user } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashStats>({
    members: null,
    coaches: null,
    employees: null,
    courses: null,
    offerings: null,
    attendance: null,
    finance: null,
  });

  // Token verify
  const [tokenCode, setTokenCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [admitLoading, setAdmitLoading] = useState(false);
  const [lookup, setLookup] = useState<TokenLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [todayList, setTodayList] = useState<TokenTodayEntry[]>([]);
  const [todayLoading, setTodayLoading] = useState(false);

  const loadTodayTokens = useCallback(async () => {
    if (!gymId) return;
    setTodayLoading(true);
    try {
      const res = await tokensService.today(gymId);
      setTodayCount(res.count);
      setTodayList(res.results || []);
    } catch {
      /* silent — optional panel */
    } finally {
      setTodayLoading(false);
    }
  }, [gymId]);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    const next: DashStats = {
      members: null,
      coaches: null,
      employees: null,
      courses: null,
      offerings: null,
      attendance: null,
      finance: null,
    };
    const tasks: Promise<void>[] = [];
    if (can('customer.view')) {
      tasks.push(
        membersService
          .list(gymId)
          .then((l) => {
            next.members = l.length;
          })
          .catch(() => {}),
      );
    }
    tasks.push(
      coachesService
        .list(gymId)
        .then((l) => {
          next.coaches = l.length;
        })
        .catch(() => {}),
    );
    if (can('employee.view')) {
      tasks.push(
        employeesService
          .list(gymId)
          .then((l) => {
            next.employees = l.length;
          })
          .catch(() => {}),
      );
    }
    if (can('attendance.view')) {
      tasks.push(
        attendanceService
          .stats(gymId)
          .then((s) => {
            next.attendance = s;
          })
          .catch(() => {}),
      );
    }
    if (can('finance.report')) {
      tasks.push(
        financeService
          .report(gymId)
          .then((r) => {
            next.finance = r;
          })
          .catch(() => {}),
      );
    }
    if (can('course.view')) {
      tasks.push(
        coursesService
          .list(gymId)
          .then((l) => {
            next.courses = l.length;
          })
          .catch(() => {}),
      );
    }
    if (can('offering.manage')) {
      tasks.push(
        offeringsService
          .list(gymId)
          .then((l) => {
            next.offerings = l.length;
          })
          .catch(() => {}),
      );
    }
    try {
      await Promise.all(tasks);
      setStats(next);
    } catch {
      setError('خطا در بارگذاری داشبورد');
    } finally {
      setLoading(false);
    }
  }, [gymId, can]);

  useEffect(() => {
    if (hasGym) {
      load();
      loadTodayTokens();
    } else {
      setLoading(false);
    }
  }, [hasGym, load, loadTodayTokens]);

  const onTokenChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 5);
    setTokenCode(digits);
    if (lookup || lookupError) {
      setLookup(null);
      setLookupError(null);
    }
  };

  const handleLookup = async () => {
    if (!gymId) return;
    const code = tokenCode.trim();
    if (code.length < 4) {
      showToast('کد توکن را وارد کنید', 'warning');
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setLookup(null);
    try {
      const res = await tokensService.lookup(gymId, code);
      setLookup(res);
      if (!res.valid) {
        showToast(res.message || 'توکن معتبر نیست', 'warning');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'خطا در بررسی توکن';
      setLookupError(msg);
      showToast(msg, 'danger');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAdmit = async () => {
    if (!gymId || !lookup?.can_admit) return;
    const code = (lookup.token_code || tokenCode).trim();
    if (!code) return;
    setAdmitLoading(true);
    try {
      const res = await tokensService.admit(gymId, code);
      showToast(res.message || 'ورود تایید شد', 'success');
      setTokenCode('');
      setLookup(null);
      setLookupError(null);
      await Promise.all([loadTodayTokens(), load()]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'خطا در تایید ورود';
      showToast(msg, 'danger');
    } finally {
      setAdmitLoading(false);
    }
  };

  if (!hasGym) return <NoGymSelected />;

  const gymName = currentGym?.gym_name || 'باشگاه شما';
  const firstName = (user?.full_name || '').split(' ')[0] || 'مدیر';

  const quickActions = [
    can('customer.create') && {
      to: '/members',
      label: 'افزودن عضو',
      icon: UserPlus,
      color: 'text-primary bg-primary-soft border-primary/20',
    },
    {
      to: '/coaches',
      label: 'افزودن مربی',
      icon: Plus,
      color: 'text-info-text bg-info-soft border-info/20',
    },
    can('attendance.create') && {
      to: '/attendance',
      label: 'ثبت حضور',
      icon: CalendarCheck,
      color: 'text-warning-text bg-warning-soft border-warning/20',
    },
    can('offering.manage') && {
      to: '/offerings',
      label: 'افزودن رشته',
      icon: Layers,
      color: 'text-primary bg-primary-soft border-primary/20',
    },
    can('finance.create') && {
      to: '/finance/payments',
      label: 'ثبت پرداخت',
      icon: CreditCard,
      color: 'text-success-text bg-success-soft border-success/20',
    },
  ].filter(Boolean) as { to: string; label: string; icon: React.ElementType; color: string }[];

  const userName = lookup?.user?.full_name || '—';
  const userPhone = lookup?.user?.phone_number || lookup?.user?.phone || '—';

  return (
    <div className="space-y-6 sm:space-y-8">
      <Header
        title={`سلام، ${firstName}`}
        subtitle={gymName}
        onQuickAction={() => {
          load();
          loadTodayTokens();
        }}
        quickActionLabel="بروزرسانی"
      />

      {/* ── Token verify ─────────────────────────────────────── */}
      <section
        aria-label="تایید توکن ورود"
        className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
        style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink">تایید توکن ورود</h2>
            <p className="text-xs text-muted mt-0.5">
              کد ۵رقمی کاربر را وارد کنید، اعتبارسنجی کنید، سپس ورود را تایید کنید.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={5}
              value={tokenCode}
              onChange={(e) => onTokenChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleLookup();
                }
              }}
              placeholder="مثلاً ۴۸۲۹۱"
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-ink tabular-nums
                placeholder:tracking-normal placeholder:font-medium placeholder:text-muted
                focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              aria-label="کد توکن"
            />
          </div>
          <button
            type="button"
            disabled={lookupLoading || tokenCode.length < 4}
            onClick={() => void handleLookup()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-fg text-sm font-bold
              disabled:opacity-50 hover:opacity-95 transition-opacity shrink-0"
          >
            {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            بررسی توکن
          </button>
        </div>

        {lookupError && (
          <div className="mt-3 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger-text flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}

        {lookup && (
          <div
            className={`mt-3 rounded-xl border px-3.5 py-3 ${
              lookup.valid && lookup.can_admit
                ? 'border-success/30 bg-success-soft'
                : lookup.valid
                  ? 'border-warning/30 bg-warning-soft'
                  : 'border-danger/30 bg-danger-soft'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {lookup.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-success-text shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-danger-text shrink-0" />
                  )}
                  <p className="text-sm font-bold text-ink truncate">
                    {lookup.message || (lookup.valid ? 'توکن معتبر است' : 'توکن نامعتبر')}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-secondary pr-6">
                  <p>
                    <span className="text-muted">کاربر: </span>
                    <span className="font-semibold text-ink">{userName}</span>
                  </p>
                  <p>
                    <span className="text-muted">موبایل: </span>
                    <span className="font-semibold tabular-nums">{userPhone}</span>
                  </p>
                  <p>
                    <span className="text-muted">وضعیت: </span>
                    <span className="font-semibold">{statusLabel(lookup.status)}</span>
                  </p>
                </div>
              </div>

              {lookup.can_admit && (
                <button
                  type="button"
                  disabled={admitLoading}
                  onClick={() => void handleAdmit()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success text-white text-sm font-bold
                    disabled:opacity-50 shrink-0"
                >
                  {admitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  تایید ورود
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Token today cards ────────────────────────────────── */}
      <section aria-label="ورودهای توکن امروز" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="ورود با توکن امروز"
          value={todayLoading ? '…' : fmt(todayCount)}
          icon={Ticket}
          accent="primary"
          subtitle="تاییدشده از طریق توکن"
        />
        <StatCard
          title="حضور امروز"
          value={fmt(stats.attendance?.today_visits)}
          icon={ClipboardCheck}
          accent="warning"
          subtitle={
            stats.attendance?.currently_inside != null
              ? `${fmt(stats.attendance.currently_inside)} نفر داخل باشگاه`
              : undefined
          }
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="اعضا"
          value={fmt(stats.members)}
          icon={Users}
          accent="info"
          onClick={can('customer.view') ? () => navigate('/members') : undefined}
        />
      </section>

      {todayList.length > 0 && (
        <section
          aria-label="آخرین ورودهای توکن"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
          style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">آخرین ورودها با توکن</h3>
            <span className="text-[11px] text-muted tabular-nums">{fmt(todayCount)} مورد</span>
          </div>
          <ul className="divide-y divide-border">
            {todayList.slice(0, 8).map((item, idx) => {
              const name =
                item.user?.full_name ||
                item.guest_name ||
                (item.token_code ? `توکن ${item.token_code}` : `ورود #${item.visit_id || idx + 1}`);
              const phone = item.user?.phone_number || item.user?.phone || '';
              const when = item.used_at || item.check_in_at;
              return (
                <li key={`${item.visit_id || idx}-${item.token_code || ''}`} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{name}</p>
                    <p className="text-[11px] text-muted truncate">
                      {phone && <span className="tabular-nums ml-2">{phone}</span>}
                      {item.token_code && <span className="text-secondary"> · کد {item.token_code}</span>}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted tabular-nums shrink-0">
                    {when ? formatJalaliDateTime(when) : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {quickActions.length > 0 && (
        <section aria-label="عملیات سریع">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">عملیات سریع</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={qa.to + qa.label}
                  to={qa.to}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200
                    hover:scale-[1.02] hover:shadow-md ${qa.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold text-center leading-tight">{qa.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {loading && <LoadingBlock label="در حال بارگذاری آمار باشگاه..." />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <section aria-label="آمار کلیدی">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
              {can('customer.view') && (
                <StatCard
                  title="اعضا"
                  value={fmt(stats.members)}
                  icon={Users}
                  accent="primary"
                  onClick={() => navigate('/members')}
                />
              )}
              <StatCard
                title="مربیان"
                value={fmt(stats.coaches)}
                icon={Dumbbell}
                accent="info"
                onClick={() => navigate('/coaches')}
              />
              {can('employee.view') && (
                <StatCard
                  title="کارکنان"
                  value={fmt(stats.employees)}
                  icon={UserCheck}
                  accent="success"
                  onClick={() => navigate('/employees')}
                />
              )}
              {can('attendance.view') && (
                <StatCard
                  title="حضور امروز"
                  value={fmt(stats.attendance?.today_visits)}
                  icon={ClipboardCheck}
                  accent="warning"
                  subtitle={
                    stats.attendance?.currently_inside != null
                      ? `${fmt(stats.attendance.currently_inside)} نفر داخل باشگاه`
                      : undefined
                  }
                  onClick={() => navigate('/attendance')}
                />
              )}
              {can('course.view') && (
                <StatCard
                  title="دوره‌ها"
                  value={fmt(stats.courses)}
                  icon={BookOpen}
                  accent="info"
                  onClick={() => navigate('/courses')}
                />
              )}
              {can('offering.manage') && (
                <StatCard
                  title="رشته‌ها"
                  value={fmt(stats.offerings)}
                  icon={Layers}
                  accent="primary"
                  onClick={() => navigate('/offerings')}
                />
              )}
              {can('finance.report') && stats.finance && (
                <StatCard
                  title="درآمد ماهانه"
                  value={money(stats.finance.monthly?.income)}
                  icon={Wallet}
                  accent="success"
                  onClick={() => navigate('/finance/reports')}
                />
              )}
            </div>
          </section>

          {can('finance.report') && stats.finance && (
            <section aria-label="خلاصه مالی" className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              {(['daily', 'monthly'] as const).map((period) => {
                const block = stats.finance![period];
                if (!block) return null;
                return (
                  <div
                    key={period}
                    className="rounded-2xl border border-border bg-surface p-5"
                    style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-ink">
                        {period === 'daily' ? 'مالی امروز' : 'مالی این ماه'}
                      </h3>
                      <Link
                        to="/finance"
                        className="text-[11px] text-primary hover:text-primary-hover inline-flex items-center gap-1"
                      >
                        جزئیات
                        <ArrowLeft className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <p className="text-[11px] text-muted mb-1">درآمد</p>
                        <p className="text-sm font-bold text-success-text tabular-nums">{money(block.income)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted mb-1">هزینه</p>
                        <p className="text-sm font-bold text-danger-text tabular-nums">{money(block.expense)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted mb-1">خالص</p>
                        <p className="text-sm font-bold text-ink tabular-nums">{money(block.net)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <section
            className="rounded-2xl border border-border bg-surface p-5"
            style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
            aria-label="میانبرها"
          >
            <h3 className="text-sm font-semibold text-ink mb-3">دسترسی سریع به بخش‌ها</h3>
            <div className="flex flex-wrap gap-2">
              {[
                can('customer.view') && { to: '/members', label: 'اعضا' },
                { to: '/coaches', label: 'مربیان' },
                can('attendance.view') && { to: '/attendance', label: 'حضور و غیاب' },
                can('offering.manage') && { to: '/offerings', label: 'رشته‌ها' },
                can('course.view') && { to: '/courses', label: 'دوره‌ها' },
                can('finance.view') && { to: '/finance/payments', label: 'پرداخت‌ها' },
                { to: '/settings', label: 'تنظیمات' },
              ]
                .filter(Boolean)
                .map((l) => {
                  const link = l as { to: string; label: string };
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-input
                        text-secondary hover:text-ink hover:border-primary/30 hover:bg-primary-soft transition-colors"
                    >
                      {link.label}
                    </Link>
                  );
                })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
