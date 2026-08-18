import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, Eye, Tag } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import pricesService from '../../services/prices/pricesService';
import sportsService from '../../services/sports/sportsService';
import type { GymPrice, Sport, GymPriceInput } from '../../types/api';

function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-ink font-medium text-left tabular-nums">{value}</span>
    </div>
  );
}

type FormState = {
  sport: string;
  session_price: string;
  monthly_price: string;
  quarterly_price: string;
  yearly_price: string;
};

const emptyForm = (): FormState => ({
  sport: '',
  session_price: '',
  monthly_price: '',
  quarterly_price: '',
  yearly_price: '',
});

function priceToForm(p: GymPrice): FormState {
  return {
    sport: p.sport != null ? String(p.sport) : '',
    session_price: p.session_price != null ? String(p.session_price) : '',
    monthly_price: p.monthly_price != null ? String(p.monthly_price) : '',
    quarterly_price: p.quarterly_price != null ? String(p.quarterly_price) : '',
    yearly_price: p.yearly_price != null ? String(p.yearly_price) : '',
  };
}

function formToPayload(form: FormState): GymPriceInput {
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  return {
    sport: form.sport ? Number(form.sport) : 0,
    session_price: num(form.session_price),
    monthly_price: num(form.monthly_price) ?? 0,
    quarterly_price: num(form.quarterly_price),
    yearly_price: num(form.yearly_price) ?? 0,
  };
}

export const PricesPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('offering.manage');
  const { showToast } = useUI();
  const canManage = can('offering.manage');

  const [items, setItems] = useState<GymPrice[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GymPrice | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymPrice | null>(null);
  const [detail, setDetail] = useState<GymPrice | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const sportNameById = useMemo(() => {
    const m = new Map<number, string>();
    sports.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [sports]);

  const resolveSport = (p: GymPrice) =>
    p.sport_name || (p.sport != null ? sportNameById.get(p.sport) : undefined) || '—';

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sp] = await Promise.all([
        pricesService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setItems((list || []).filter((x) => x && x.id != null));
      setSports(sp || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت قیمت‌ها');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && canManage) load();
  }, [hasGym, load, canManage]);

  const filtered = useMemo(() => {
    let rows = items;
    if (sportFilter !== 'all') rows = rows.filter((r) => r.sport === Number(sportFilter));
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => resolveSport(r).toLowerCase().includes(q));
    return rows;
  }, [items, search, sportFilter, sportNameById]);

  const availableSportsForCreate = useMemo(() => {
    const used = new Set(items.map((i) => i.sport));
    if (editing) return sports;
    return sports.filter((s) => !used.has(s.id));
  }, [sports, items, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = async (p: GymPrice) => {
    setEditing(p);
    setForm(priceToForm(p));
    setFormErrors({});
    setOpen(true);
    if (!gymId) return;
    try {
      const fresh = await pricesService.get(gymId, p.id);
      setEditing(fresh);
      setForm(priceToForm(fresh));
    } catch {
      /* keep */
    }
  };

  const openDetail = async (p: GymPrice) => {
    setDetail(p);
    if (!gymId) return;
    setDetailLoading(true);
    try {
      setDetail(await pricesService.get(gymId, p.id));
    } catch {
      /* keep */
    } finally {
      setDetailLoading(false);
    }
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!editing && !form.sport) errs.sport = 'رشته ورزشی را انتخاب کنید.';
    if (form.monthly_price === '' || Number(form.monthly_price) < 0) {
      errs.monthly_price = 'قیمت ماهانه الزامی است.';
    }
    if (form.yearly_price === '' || Number(form.yearly_price) < 0) {
      errs.yearly_price = 'قیمت سالانه الزامی است.';
    }
    return errs;
  };

  const handleSave = async () => {
    if (!gymId) return;
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) {
      showToast(Object.values(errs)[0], 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editing) {
        await pricesService.replace(gymId, editing.id, { ...payload, sport: editing.sport });
        showToast('قیمت با موفقیت ویرایش شد', 'success');
      } else {
        await pricesService.create(gymId, payload);
        showToast('قیمت با موفقیت ثبت شد', 'success');
      }
      setOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    setSaving(true);
    try {
      await pricesService.remove(gymId, deleting.id);
      showToast('قیمت با موفقیت حذف شد', 'success');
      setDeleting(null);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<GymPrice>[] = [
    {
      key: 'sport_name',
      header: 'رشته',
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-soft border border-border flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-ink truncate">{resolveSport(r)}</span>
        </div>
      ),
    },
    {
      key: 'session_price',
      header: 'تک‌جلسه',
      render: (r) => <span className="text-sm tabular-nums text-muted">{formatMoney(r.session_price)}</span>,
    },
    {
      key: 'monthly_price',
      header: 'ماهانه',
      render: (r) => <span className="text-sm tabular-nums text-ink font-medium">{formatMoney(r.monthly_price)}</span>,
    },
    {
      key: 'quarterly_price',
      header: 'سه‌ماهه',
      render: (r) => <span className="text-sm tabular-nums text-muted">{formatMoney(r.quarterly_price)}</span>,
    },
    {
      key: 'yearly_price',
      header: 'سالانه',
      render: (r) => <span className="text-sm tabular-nums text-ink">{formatMoney(r.yearly_price)}</span>,
    },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-28',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover" aria-label="جزئیات" title="جزئیات">
            <Eye className="w-4 h-4" />
          </button>
          {canManage && (
            <>
              <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft" aria-label="ویرایش" title="ویرایش">
                <Edit3 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-danger-soft" aria-label="حذف" title="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!hasGym) return <NoGymSelected />;
  if (!canManage) {
    return (
      <div className="space-y-4">
        <Header title="قیمت‌ها" subtitle="تعرفه رشته‌های باشگاه" />
        <ErrorBlock message="شما دسترسی مدیریت قیمت‌ها را ندارید." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        title="قیمت‌ها"
        subtitle="تعرفه تک‌جلسه، ماهانه، سه‌ماهه و سالانه هر رشته"
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
              <Plus className="w-4 h-4" />
              قیمت جدید
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو بر اساس نام رشته..."
          className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink">
          <option value="all">همه رشته‌ها</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !items.length ? (
        <LoadingBlock />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          title="قیمتی ثبت نشده است"
          description={items.length ? 'با فیلتر فعلی نتیجه‌ای نیست.' : 'برای هر رشته یک تعرفه تعریف کنید.'}
          action={
            !items.length ? (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
                <Plus className="w-4 h-4" />
                ثبت اولین قیمت
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'ویرایش قیمت' : 'قیمت جدید'}>
        <div className="space-y-3">
          {editing ? (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted">رشته ورزشی</p>
              <div className="rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm font-medium text-ink">
                {resolveSport(editing)}
              </div>
            </div>
          ) : (
            <FormField
              label="رشته ورزشی"
              required
              isSelect
              value={form.sport}
              error={formErrors.sport}
              options={[
                { value: '', label: availableSportsForCreate.length ? 'انتخاب رشته' : 'همه رشته‌ها قیمت دارند' },
                ...availableSportsForCreate.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
              onChange={(e) => setForm({ ...form, sport: e.target.value })}
              helpText={!availableSportsForCreate.length ? 'برای همه رشته‌های فعلی تعرفه ثبت شده است.' : undefined}
            />
          )}
          <FormField label="قیمت تک‌جلسه (تومان)" type="number" min={0} value={form.session_price} onChange={(e) => setForm({ ...form, session_price: e.target.value })} />
          <FormField label="قیمت ماهانه (تومان)" required type="number" min={0} value={form.monthly_price} error={formErrors.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} />
          <FormField label="قیمت سه‌ماهه (تومان)" type="number" min={0} value={form.quarterly_price} onChange={(e) => setForm({ ...form, quarterly_price: e.target.value })} />
          <FormField label="قیمت سالانه (تومان)" required type="number" min={0} value={form.yearly_price} error={formErrors.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={saving} onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات تعرفه">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm">
            <DetailRow label="رشته" value={resolveSport(detail)} />
            <DetailRow label="تک‌جلسه" value={formatMoney(detail.session_price)} />
            <DetailRow label="ماهانه" value={formatMoney(detail.monthly_price)} />
            <DetailRow label="سه‌ماهه" value={formatMoney(detail.quarterly_price)} />
            <DetailRow label="سالانه" value={formatMoney(detail.yearly_price)} />
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="حذف قیمت"
        itemName={deleting ? resolveSport(deleting) : ''}
      />
    </div>
  );
};

export default PricesPage;
