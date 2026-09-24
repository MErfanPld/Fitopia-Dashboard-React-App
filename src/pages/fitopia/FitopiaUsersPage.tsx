import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, RefreshCw, Ticket, Users, CalendarCheck, Search } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import membersService from '../../services/members/membersService';
import attendanceService from '../../services/attendance/attendanceService';
import tokensService, { type TokenTodayEntry } from '../../services/tokens/tokensService';
import type { GymMember, GymVisit } from '../../types/api';
import { formatJalaliDate, formatJalaliDateTime } from '../../utils/jalaliUtils';

function isFitopiaMember(m: GymMember): boolean {
  const source = String(m.source || '').toLowerCase();
  if (source === 'token' || source === 'fitopia' || source === 'fitopia_token') return true;
  const flag = m.is_fitopia_user as unknown;
  if (flag === true || flag === 'true' || flag === 1 || flag === '1') return true;
  if (m.fitopia_user != null && Number(m.fitopia_user) > 0) return true;
  return false;
}

function isTokenVisit(v: GymVisit): boolean {
  const method = String(v.method || '').toLowerCase();
  const source = String(v.source || '').toLowerCase();
  if (method.includes('token') || source.includes('token') || source.includes('fitopia')) return true;
  if (v.token_code) return true;
  return false;
}

function planLabel(m: GymMember): string {
  const t = String(m.membership_type || '').toLowerCase();
  const map: Record<string, string> = {
    session_pack: 'بسته جلسات',
    monthly: 'ماهانه',
    course: 'دوره',
    drop_in: 'تک‌جلسه',
    yearly: 'سالانه',
    quarterly: 'فصلی',
  };
  if (t && map[t]) return map[t];
  if (m.membership_type) return String(m.membership_type);
  if (m.sessions_total != null && Number(m.sessions_total) > 0) {
    return `بسته ${Number(m.sessions_total).toLocaleString('fa-IR')} جلسه`;
  }
  return '—';
}

function money(n?: number | null): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('fa-IR');
}

export const FitopiaUsersPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('customer.view');
  const [members, setMembers] = useState<GymMember[]>([]);
  const [visits, setVisits] = useState<GymVisit[]>([]);
  const [todayTokens, setTodayTokens] = useState<TokenTodayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [mList, vList, today] = await Promise.all([
        membersService.list(gymId),
        attendanceService.list(gymId).catch(() => [] as GymVisit[]),
        tokensService.today(gymId).catch(() => ({ count: 0, results: [] as TokenTodayEntry[] })),
      ]);
      setMembers((mList || []).filter((x) => x && x.id != null));
      setVisits((vList || []).filter((x) => x && x.id != null));
      setTodayTokens(today.results || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت کاربران فیتوپیا');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('customer.view')) load();
  }, [hasGym, load, can]);

  const fitopiaMembers = useMemo(() => members.filter(isFitopiaMember), [members]);
  const tokenVisits = useMemo(() => visits.filter(isTokenVisit), [visits]);

  const visitsByCustomer = useMemo(() => {
    const map = new Map<number, GymVisit[]>();
    for (const v of tokenVisits) {
      const cid = v.customer != null ? Number(v.customer) : null;
      if (cid == null || !Number.isFinite(cid)) continue;
      const arr = map.get(cid) || [];
      arr.push(v);
      map.set(cid, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const ta = a.check_in_at ? new Date(String(a.check_in_at)).getTime() : 0;
        const tb = b.check_in_at ? new Date(String(b.check_in_at)).getTime() : 0;
        return tb - ta;
      });
    }
    return map;
  }, [tokenVisits]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fitopiaMembers;
    return fitopiaMembers.filter((m) => {
      const blob = [m.full_name, m.phone, m.sport_name, planLabel(m), m.membership_type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [fitopiaMembers, search]);

  const selected = useMemo(
    () => fitopiaMembers.find((m) => m.id === selectedId) || null,
    [fitopiaMembers, selectedId],
  );

  const selectedVisits = useMemo(() => {
    if (!selected) return [] as GymVisit[];
    return visitsByCustomer.get(selected.id) || [];
  }, [selected, visitsByCustomer]);

  const stats = useMemo(() => {
    const withSessions = fitopiaMembers.filter(
      (m) => m.sessions_total != null && Number(m.sessions_total) > 0,
    ).length;
    return {
      users: fitopiaMembers.length,
      today: todayTokens.length,
      usages: tokenVisits.length,
      plans: withSessions,
    };
  }, [fitopiaMembers, todayTokens, tokenVisits]);

  const columns: Column<GymMember>[] = [
    {
      key: 'full_name',
      header: 'کاربر',
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedId(r.id)}
          className="text-right min-w-0 w-full hover:opacity-90"
        >
          <p className="font-medium text-ink truncate">{r.full_name}</p>
          <p className="text-[11px] text-muted tabular-nums">{r.phone || '—'}</p>
        </button>
      ),
    },
    {
      key: 'plan',
      header: 'پلن / اشتراک',
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm text-ink font-medium">{planLabel(r)}</p>
          {r.sport_name && <p className="text-[11px] text-muted truncate">{r.sport_name}</p>}
        </div>
      ),
    },
    {
      key: 'sessions',
      header: 'جلسات',
      render: (r) => {
        const total = r.sessions_total;
        const rem = r.sessions_remaining ?? r.sessions_remaining_calc;
        if (total == null && rem == null) return <span className="text-muted text-sm">—</span>;
        return (
          <span className="text-sm tabular-nums text-secondary">
            {rem != null ? fmt(Number(rem)) : '—'}
            {total != null ? ` / ${fmt(Number(total))}` : ''}
          </span>
        );
      },
    },
    {
      key: 'price_paid',
      header: 'مبلغ',
      render: (r) => <span className="text-sm tabular-nums text-muted">{money(r.price_paid)}</span>,
    },
    {
      key: 'join_date',
      header: 'تاریخ عضویت',
      render: (r) => (
        <span className="text-xs tabular-nums text-muted">
          {r.join_date ? formatJalaliDate(r.join_date) : '—'}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'استفاده اعتبار',
      render: (r) => {
        const n = (visitsByCustomer.get(r.id) || []).length;
        return (
          <button
            type="button"
            onClick={() => setSelectedId(r.id)}
            className="text-sm font-semibold text-primary tabular-nums"
          >
            {fmt(n)} بار
          </button>
        );
      },
    },
  ];

  if (!hasGym) return <NoGymSelected />;
  if (!can('customer.view')) {
    return (
      <div className="space-y-4">
        <Header title="کاربران فیتوپیا" />
        <ErrorBlock message="شما دسترسی مشاهده این بخش را ندارید." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        title="کاربران فیتوپیا"
        subtitle="پلن خریداری‌شده و سابقه استفاده از اعتبار ورود"
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="کاربران فیتوپیا" value={fmt(stats.users)} icon={Users} accent="primary" />
        <StatCard title="ورود اعتبار امروز" value={fmt(stats.today)} icon={Ticket} accent="warning" />
        <StatCard title="کل استفاده‌ها" value={fmt(stats.usages)} icon={CalendarCheck} accent="info" />
        <StatCard title="دارای بسته جلسه" value={fmt(stats.plans)} icon={Sparkles} accent="success" />
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو نام، موبایل یا پلن..."
          className="w-full rounded-xl border border-border bg-input pr-10 pl-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !fitopiaMembers.length ? (
        <LoadingBlock />
      ) : !error && filteredMembers.length === 0 ? (
        <EmptyState
          title="کاربر فیتوپیایی یافت نشد"
          description={
            fitopiaMembers.length
              ? 'با جستجوی فعلی نتیجه‌ای نیست.'
              : 'هنوز عضوی از طریق اپ فیتوپیا ثبت نشده است.'
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredMembers}
          rowKey={(r) => r.id}
          loading={loading}
        />
      )}

      {selected && (
        <section
          className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4"
          style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink truncate">{selected.full_name}</h3>
              <p className="text-xs text-muted tabular-nums mt-0.5">{selected.phone || '—'}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs text-muted hover:text-ink shrink-0"
            >
              بستن
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-border bg-input/40 p-3">
              <p className="text-muted mb-1">پلن</p>
              <p className="font-semibold text-ink">{planLabel(selected)}</p>
            </div>
            <div className="rounded-xl border border-border bg-input/40 p-3">
              <p className="text-muted mb-1">رشته</p>
              <p className="font-semibold text-ink">{selected.sport_name || '—'}</p>
            </div>
            <div className="rounded-xl border border-border bg-input/40 p-3">
              <p className="text-muted mb-1">جلسات باقی / کل</p>
              <p className="font-semibold text-ink tabular-nums">
                {selected.sessions_remaining != null || selected.sessions_remaining_calc != null
                  ? fmt(Number(selected.sessions_remaining ?? selected.sessions_remaining_calc))
                  : '—'}
                {' / '}
                {selected.sessions_total != null ? fmt(Number(selected.sessions_total)) : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-input/40 p-3">
              <p className="text-muted mb-1">مبلغ پرداختی</p>
              <p className="font-semibold text-ink tabular-nums">{money(selected.price_paid)}</p>
            </div>
            <div className="rounded-xl border border-border bg-input/40 p-3">
              <p className="text-muted mb-1">شروع عضویت</p>
              <p className="font-semibold text-ink tabular-nums">
                {selected.membership_start
                  ? formatJalaliDate(selected.membership_start)
                  : selected.join_date
                    ? formatJalaliDate(selected.join_date)
                    : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-input/40 p-3">
              <p className="text-muted mb-1">پایان عضویت</p>
              <p className="font-semibold text-ink tabular-nums">
                {selected.membership_end ? formatJalaliDate(selected.membership_end) : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-input/40 p-3">
              <p className="text-muted mb-1">وضعیت</p>
              <p className="font-semibold text-ink">{selected.membership_status || '—'}</p>
            </div>
            <div className="rounded-xl border border-border bg-input/40 p-3">
              <p className="text-muted mb-1">تعداد استفاده اعتبار</p>
              <p className="font-semibold text-ink tabular-nums">{fmt(selectedVisits.length)}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-ink mb-2">سابقه استفاده از اعتبار</h4>
            {selectedVisits.length === 0 ? (
              <p className="text-xs text-muted">هنوز استفاده‌ای از اعتبار ثبت نشده است.</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {selectedVisits.slice(0, 30).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 bg-surface"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink">
                        {v.token_code ? `کد ${v.token_code}` : 'ورود با اعتبار'}
                        {v.sport_name ? (
                          <span className="text-muted text-xs mr-2"> · {v.sport_name}</span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-muted">
                        {v.is_open ? 'داخل باشگاه' : 'خارج‌شده'}
                        {v.check_out_at
                          ? ` · خروج ${formatJalaliDateTime(String(v.check_out_at))}`
                          : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted tabular-nums shrink-0">
                      {v.check_in_at ? formatJalaliDateTime(String(v.check_in_at)) : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {todayTokens.length > 0 && (
        <section
          className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
          style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">ورود با اعتبار — امروز</h3>
            <span className="text-[11px] text-muted tabular-nums">{fmt(todayTokens.length)} مورد</span>
          </div>
          <ul className="divide-y divide-border">
            {todayTokens.slice(0, 15).map((item, idx) => {
              const name =
                item.user?.full_name ||
                item.guest_name ||
                (item.token_code ? `اعتبار ${item.token_code}` : `ورود #${item.visit_id || idx + 1}`);
              const phone = item.user?.phone_number || item.user?.phone || '';
              const when = item.used_at || item.check_in_at;
              return (
                <li
                  key={`${item.visit_id || idx}-${item.token_code || ''}`}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{name}</p>
                    <p className="text-[11px] text-muted truncate">
                      {phone && <span className="tabular-nums">{phone}</span>}
                      {item.token_code && (
                        <span className="text-secondary"> · کد {item.token_code}</span>
                      )}
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
    </div>
  );
};

export default FitopiaUsersPage;
