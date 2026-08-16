import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Trash2, Eye, RefreshCw, UserPlus, User } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import membersService from '../../services/members/membersService';
import sportsService from '../../services/sports/sportsService';
import type { GymMember, GymMemberInput, Sport } from '../../types/api';
import { formatJalaliNumeric, formatJalaliDateTime, toPersianDigits } from '../../utils/jalaliUtils';

type FitopiaFilter = 'all' | 'fitopia' | 'gym';
type SourceFilter = 'all' | 'manual' | 'token';

const emptyForm: GymMemberInput = {
  full_name: '', phone: '', sport: null, sessions_total: null,
  sessions_remaining: null, price_paid: null,
  join_date: new Date().toISOString().slice(0, 10),
};

function isFitopiaUser(v: boolean | string | undefined): boolean {
  return v === true || v === 'true' || v === 'True';
}
function sourceLabel(source?: string | null): string {
  if (source === 'token') return 'توکن';
  if (source === 'manual') return 'دستی';
  return source || '—';
}
function moneyFa(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${toPersianDigits(n.toLocaleString('en-US'))} تومان`;
}
function numFa(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  return toPersianDigits(String(n));
}

function MemberAvatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('');
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-primary-soft border border-border shrink-0 flex items-center justify-center">
        {initials ? <span className="text-xs font-bold text-primary">{initials}</span> : <User className="w-4 h-4 text-primary" />}
      </div>
      <span className="font-medium text-ink truncate">{name}</span>
    </div>
  );
}

function validateForm(form: GymMemberInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.full_name.trim()) errors.full_name = 'نام و نام خانوادگی الزامی است.';
  const phone = form.phone.trim().replace(/\s+/g, '');
  if (!phone) errors.phone = 'شماره موبایل الزامی است.';
  else if (!/^09\d{9}$/.test(phone) && !/^\+98\d{10}$/.test(phone) && !/^9\d{9}$/.test(phone)) {
    errors.phone = 'شماره موبایل معتبر نیست.';
  }
  if (form.sport == null || form.sport === 0) errors.sport = 'رشته ورزشی را انتخاب کنید.';
  if (!form.join_date) errors.join_date = 'تاریخ عضویت الزامی است.';
  if (form.sessions_total != null && (form.sessions_total < 0 || !Number.isInteger(form.sessions_total))) {
    errors.sessions_total = 'تعداد جلسات باید عدد صحیح و غیرمنفی باشد.';
  }
  if (form.sessions_remaining != null && form.sessions_remaining < 0) {
    errors.sessions_remaining = 'جلسات باقی‌مانده نمی‌تواند منفی باشد.';
  }
  if (form.price_paid != null && form.price_paid < 0) errors.price_paid = 'مبلغ پرداختی نمی‌تواند منفی باشد.';
  return errors;
}

function DetailRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-ink font-medium text-left ${ltr ? 'dir-ltr font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export const MembersPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('customer.view');
  const { showToast } = useUI();
  const [items, setItems] = useState<GymMember[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [fitopiaFilter, setFitopiaFilter] = useState<FitopiaFilter>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GymMember | null>(null);
  const [form, setForm] = useState<GymMemberInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymMember | null>(null);
  const [detail, setDetail] = useState<GymMember | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sp] = await Promise.all([
        membersService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setItems(list);
      setSports(sp);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت اعضای باشگاه');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('customer.view')) load();
  }, [hasGym, load, can]);

  const filtered = useMemo(() => {
    let rows = items;
    if (sportFilter !== 'all') rows = rows.filter((r) => r.sport === Number(sportFilter));
    if (sourceFilter !== 'all') rows = rows.filter((r) => (r.source || 'manual') === sourceFilter);
    if (fitopiaFilter === 'fitopia') rows = rows.filter((r) => isFitopiaUser(r.is_fitopia_user));
    else if (fitopiaFilter === 'gym') rows = rows.filter((r) => !isFitopiaUser(r.is_fitopia_user));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) => r.full_name.toLowerCase().includes(q) || r.phone.includes(q) || (r.sport_name || '').toLowerCase().includes(q),
      );
    }
    return rows;
  }, [items, sportFilter, sourceFilter, fitopiaFilter, search]);

  const sportOptions = useMemo(() => {
    if (sports.length) return [{ value: '', label: 'انتخاب رشته' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))];
    const map = new Map<number, string>();
    items.forEach((m) => { if (m.sport != null) map.set(m.sport, m.sport_name || `رشته ${m.sport}`); });
    return [{ value: '', label: 'انتخاب رشته' }, ...Array.from(map.entries()).map(([id, name]) => ({ value: String(id), label: name }))];
  }, [sports, items]);

  const filterSportOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'همه رشته‌ها' }];
    if (sports.length) sports.forEach((s) => opts.push({ value: String(s.id), label: s.name }));
    else {
      const map = new Map<number, string>();
      items.forEach((m) => { if (m.sport != null) map.set(m.sport, m.sport_name || `رشته ${m.sport}`); });
      map.forEach((name, id) => opts.push({ value: String(id), label: name }));
    }
    return opts;
  }, [sports, items]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, join_date: new Date().toISOString().slice(0, 10) });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = async (m: GymMember) => {
    if (!gymId) return;
    setEditing(m);
    setFormErrors({});
    setForm({
      full_name: m.full_name, phone: m.phone, sport: m.sport,
      sessions_total: m.sessions_total, sessions_remaining: m.sessions_remaining,
      price_paid: m.price_paid, join_date: m.join_date || '',
    });
    setModalOpen(true);
    try {
      const full = await membersService.get(gymId, m.id);
      setForm({
        full_name: full.full_name, phone: full.phone, sport: full.sport,
        sessions_total: full.sessions_total, sessions_remaining: full.sessions_remaining,
        price_paid: full.price_paid, join_date: full.join_date || '',
      });
      setEditing(full);
    } catch { /* keep list row */ }
  };

  const openDetail = async (m: GymMember) => {
    setDetail(m);
    if (!gymId) return;
    setDetailLoading(true);
    try { setDetail(await membersService.get(gymId, m.id)); }
    catch { /* keep */ }
    finally { setDetailLoading(false); }
  };

  const handleSave = async () => {
    if (!gymId) return;
    const errs = validateForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length) { showToast(Object.values(errs)[0], 'warning'); return; }
    setSaving(true);
    try {
      const payload: GymMemberInput = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim().replace(/\s+/g, ''),
        sport: form.sport,
        sessions_total: form.sessions_total,
        sessions_remaining: form.sessions_remaining,
        price_paid: form.price_paid,
        join_date: form.join_date,
      };
      if (editing) {
        await membersService.update(gymId, editing.id, payload);
        showToast('عضو با موفقیت به‌روزرسانی شد.', 'success');
      } else {
        await membersService.create(gymId, payload);
        showToast('عضو با موفقیت ثبت شد.', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ذخیره', 'danger');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    try {
      await membersService.remove(gymId, deleting.id);
      showToast('عضو با موفقیت حذف شد.', 'success');
      setDeleting(null);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در حذف', 'danger');
    }
  };

  const columns: Column<GymMember>[] = [
    { key: 'full_name', header: 'عضو', render: (r) => <MemberAvatar name={r.full_name} /> },
    { key: 'phone', header: 'شماره تماس', render: (r) => <span className="text-muted text-sm dir-ltr font-mono">{r.phone}</span> },
    { key: 'sport_name', header: 'رشته', render: (r) => <span className="text-ink text-sm">{r.sport_name || '—'}</span> },
    {
      key: 'source', header: 'منبع',
      render: (r) => (
        <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium bg-surface-elevated border border-border text-secondary">
          {sourceLabel(r.source)}
        </span>
      ),
    },
    { key: 'added_by_name', header: 'ثبت‌کننده', render: (r) => <span className="text-muted text-xs">{r.added_by_name || 'سیستم'}</span> },
    { key: 'sessions_total', header: 'جلسات کل', render: (r) => <span className="text-ink text-sm">{numFa(r.sessions_total)}</span> },
    { key: 'sessions_remaining', header: 'باقی‌مانده', render: (r) => <span className="text-muted text-sm">{numFa(r.sessions_remaining)}</span> },
    { key: 'price_paid', header: 'مبلغ پرداختی', render: (r) => <span className="text-ink text-sm whitespace-nowrap">{moneyFa(r.price_paid)}</span> },
    { key: 'join_date', header: 'تاریخ عضویت', render: (r) => <span className="text-muted text-xs whitespace-nowrap">{formatJalaliNumeric(r.join_date)}</span> },
    {
      key: 'is_fitopia_user', header: 'وضعیت',
      render: (r) => isFitopiaUser(r.is_fitopia_user) ? (
        <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold bg-primary-soft text-primary border border-primary/20">کاربر Fitopia</span>
      ) : (
        <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium bg-surface-elevated text-secondary border border-border">عضو باشگاه</span>
      ),
    },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="مدیریت اعضا" /><NoGymSelected /></div>;
  if (!can('customer.view')) return <div className="space-y-6"><Header title="مدیریت اعضا" /><EmptyState title="دسترسی ندارید" description="مجوز مشاهده اعضا برای نقش شما فعال نیست." /></div>;

  return (
    <div className="space-y-6">
      <Header title="مدیریت اعضا" onQuickAction={can('customer.create') ? openCreate : undefined} quickActionLabel={can('customer.create') ? 'افزودن عضو' : undefined} />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی نام یا شماره موبایل..."
            className="w-full max-w-md rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-ink placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
            {filterSportOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            className="rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">همه منابع</option>
            <option value="manual">دستی</option>
            <option value="token">توکن</option>
          </select>
          <select value={fitopiaFilter} onChange={(e) => setFitopiaFilter(e.target.value as FitopiaFilter)}
            className="rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">همه اعضا</option>
            <option value="fitopia">کاربر Fitopia</option>
            <option value="gym">عضو باشگاه</option>
          </select>
        </div>
        <button type="button" onClick={load}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-ink hover:bg-surface-hover shrink-0">
          <RefreshCw className="w-4 h-4" /> به‌روزرسانی
        </button>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="هنوز عضوی ثبت نشده است" description="اولین عضو باشگاه را اضافه کنید."
          action={can('customer.create') ? (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-fg text-sm font-bold">
              <UserPlus className="w-4 h-4" /> افزودن اولین عضو
            </button>
          ) : undefined}
        />
      )}
      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <EmptyState title="نتیجه‌ای یافت نشد" description="فیلتر یا جستجو را تغییر دهید." />
      )}
      {!loading && !error && filtered.length > 0 && (
        <DataTable columns={columns} data={filtered}
          actions={(r) => (
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover" title="جزئیات"><Eye className="w-4 h-4" /></button>
              {can('customer.update') && <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover" title="ویرایش"><Edit3 className="w-4 h-4" /></button>}
              {can('customer.delete') && <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-surface-hover" title="حذف"><Trash2 className="w-4 h-4" /></button>}
            </div>
          )}
        />
      )}

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editing ? 'ویرایش عضو' : 'افزودن عضو'}>
        <div className="space-y-4">
          <FormField label="نام و نام خانوادگی" required value={form.full_name} error={formErrors.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <FormField label="شماره موبایل" required value={form.phone} error={formErrors.phone} placeholder="09xxxxxxxxx" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <FormField label="رشته ورزشی" required isSelect value={form.sport != null ? String(form.sport) : ''} error={formErrors.sport} options={sportOptions}
            onChange={(e) => setForm({ ...form, sport: e.target.value ? Number(e.target.value) : null })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="تعداد جلسات" type="number" min={0} value={form.sessions_total ?? ''} error={formErrors.sessions_total}
              onChange={(e) => setForm({ ...form, sessions_total: e.target.value === '' ? null : Number(e.target.value) })} />
            <FormField label="جلسات باقی‌مانده" type="number" min={0} value={form.sessions_remaining ?? ''} error={formErrors.sessions_remaining}
              onChange={(e) => setForm({ ...form, sessions_remaining: e.target.value === '' ? null : Number(e.target.value) })} />
          </div>
          <FormField label="مبلغ پرداختی (تومان)" type="number" min={0} value={form.price_paid ?? ''} error={formErrors.price_paid}
            onChange={(e) => setForm({ ...form, price_paid: e.target.value === '' ? null : Number(e.target.value) })} />
          <JalaliDatePicker label="تاریخ عضویت" value={form.join_date || ''} onChange={(v) => setForm({ ...form, join_date: v })} />
          {formErrors.join_date && <p className="text-[11px] text-danger-text -mt-2">{formErrors.join_date}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات عضو">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm">
            <DetailRow label="نام" value={detail.full_name} />
            <DetailRow label="موبایل" value={detail.phone} ltr />
            <DetailRow label="رشته" value={detail.sport_name || '—'} />
            <DetailRow label="منبع" value={sourceLabel(detail.source)} />
            <DetailRow label="ثبت‌کننده" value={detail.added_by_name || 'سیستم'} />
            <DetailRow label="جلسات کل" value={numFa(detail.sessions_total)} />
            <DetailRow label="جلسات باقی‌مانده" value={numFa(detail.sessions_remaining)} />
            <DetailRow label="مبلغ پرداختی" value={moneyFa(detail.price_paid)} />
            <DetailRow label="تاریخ عضویت" value={formatJalaliNumeric(detail.join_date)} />
            <DetailRow label="وضعیت Fitopia" value={isFitopiaUser(detail.is_fitopia_user) ? 'کاربر Fitopia' : 'عضو باشگاه'} />
            <DetailRow label="تاریخ ایجاد" value={formatJalaliDateTime(detail.created_at)} />
            <DetailRow label="آخرین بروزرسانی" value={formatJalaliDateTime(detail.updated_at)} />
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="حذف عضو" itemName={deleting?.full_name || ''} />
    </div>
  );
};
