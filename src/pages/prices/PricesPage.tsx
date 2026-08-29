import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, Eye, Tag } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorBlock } from '../../components/common/ErrorBlock';
import { FormField } from '../../components/common/FormField';
import { FilterPopover } from '../../components/common/FilterPopover';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { pricesService } from '../../services/pricesService';
import { offeringsService } from '../../services/offeringsService';
import type { Price, PriceWrite } from '../../types/price';
import type { Offering } from '../../types/offering';

const emptyForm: PriceWrite = {
  sport: 0,
  single_session_price: '',
  monthly_price: '',
  quarterly_price: '',
  yearly_price: '',
};

function formatPrice(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('fa-IR') + ' تومان';
}

export const PricesPage: React.FC = () => {
  const { activeGymId, hasPermission } = useAuth();
  const { showToast } = useToast();
  const can = (p: string) => hasPermission(p);

  const [items, setItems] = useState<Price[]>([]);
  const [sports, setSports] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Price | null>(null);
  const [detail, setDetail] = useState<Price | null>(null);
  const [deleting, setDeleting] = useState<Price | null>(null);
  const [form, setForm] = useState<PriceWrite>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sportFilter, setSportFilter] = useState('');

  const load = useCallback(async () => {
    if (!activeGymId) return;
    setLoading(true);
    setError(null);
    try {
      const [pricesRes, sportsRes] = await Promise.all([
        pricesService.list(activeGymId),
        offeringsService.list(activeGymId),
      ]);
      setItems(Array.isArray(pricesRes) ? pricesRes : (pricesRes as { results?: Price[] }).results || []);
      setSports(Array.isArray(sportsRes) ? sportsRes : (sportsRes as { results?: Offering[] }).results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت داده‌ها');
    } finally {
      setLoading(false);
    }
  }, [activeGymId]);

  useEffect(() => {
    load();
  }, [load]);

  const sportName = (id: number) => sports.find((s) => s.id === id)?.title || sports.find((s) => s.id === id)?.name || `#${id}`;

  const filtered = useMemo(() => {
    if (!sportFilter) return items;
    return items.filter((p) => String(p.sport) === sportFilter);
  }, [items, sportFilter]);

  const availableSportsForCreate = useMemo(() => {
    const used = new Set(items.map((p) => p.sport));
    return sports.filter((s) => !used.has(s.id));
  }, [items, sports]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (r: Price) => {
    setEditing(r);
    setForm({
      sport: r.sport,
      single_session_price: String(r.single_session_price ?? ''),
      monthly_price: String(r.monthly_price ?? ''),
      quarterly_price: String(r.quarterly_price ?? ''),
      yearly_price: String(r.yearly_price ?? ''),
    });
    setFormErrors({});
    setOpen(true);
  };

  const openDetail = (r: Price) => setDetail(r);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.sport) errs.sport = 'انتخاب رشته الزامی است';
    if (!form.monthly_price && form.monthly_price !== '0') errs.monthly_price = 'قیمت ماهانه الزامی است';
    if (!form.yearly_price && form.yearly_price !== '0') errs.yearly_price = 'قیمت سالانه الزامی است';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!activeGymId || !validate()) return;
    setSaving(true);
    try {
      const payload: PriceWrite = {
        sport: Number(form.sport),
        single_session_price: form.single_session_price || '0',
        monthly_price: form.monthly_price || '0',
        quarterly_price: form.quarterly_price || '0',
        yearly_price: form.yearly_price || '0',
      };
      if (editing) {
        await pricesService.update(activeGymId, editing.id, payload);
        showToast('قیمت با موفقیت ویرایش شد');
      } else {
        await pricesService.create(activeGymId, payload);
        showToast('قیمت با موفقیت ثبت شد');
      }
      setOpen(false);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'خطا در ذخیره‌سازی', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeGymId || !deleting) return;
    try {
      await pricesService.remove(activeGymId, deleting.id);
      showToast('قیمت با موفقیت حذف شد');
      setDeleting(null);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'خطا در حذف', 'error');
    }
  };

  const columns: Column<Price>[] = [
    {
      key: 'sport',
      header: 'رشته',
      render: (r) => <span className="font-medium text-ink">{sportName(r.sport)}</span>,
    },
    {
      key: 'single_session_price',
      header: 'تک‌جلسه',
      render: (r) => formatPrice(r.single_session_price),
    },
    {
      key: 'monthly_price',
      header: 'ماهانه',
      render: (r) => formatPrice(r.monthly_price),
    },
    {
      key: 'quarterly_price',
      header: 'سه‌ماهه',
      render: (r) => formatPrice(r.quarterly_price),
    },
    {
      key: 'yearly_price',
      header: 'سالانه',
      render: (r) => formatPrice(r.yearly_price),
    },
    {
      key: 'actions',
      header: 'عملیات',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover" aria-label="جزئیات">
            <Eye className="w-4 h-4" />
          </button>
          {can('price.update') && (
            <>
              <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft" aria-label="ویرایش">
                <Edit3 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-danger-soft" aria-label="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!activeGymId) {
    return (
      <div className="p-6">
        <Header title="قیمت‌ها" subtitle="تعرفه رشته‌های باشگاه" />
        <ErrorBlock message="شما دسترسی مدیریتی به باشگاهی ندارید." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Header
        title="قیمت‌ها"
        subtitle="تعرفه تک‌جلسه، ماهانه، سه‌ماهه و سالانه هر رشته"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-ink hover:bg-surface-hover text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              بروزرسانی
            </button>
            {can('price.create') && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                قیمت جدید
              </button>
            )}
          </div>
        }
      />

      {error && <ErrorBlock message={error} onRetry={load} />}

      <div className="flex flex-wrap items-center gap-3">
        <FilterPopover
          fields={[
            {
              key: 'sport',
              label: 'رشته',
              value: sportFilter,
              onChange: setSportFilter,
              options: [
                { value: '', label: 'همه' },
                ...sports.map((s) => ({ value: String(s.id), label: s.title || s.name || `#${s.id}` })),
              ],
            },
          ]}
          activeCount={sportFilter ? 1 : 0}
          onClear={() => setSportFilter('')}
        />
      </div>

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-10 h-10" />}
          title="قیمتی ثبت نشده است"
          description={items.length ? 'با فیلتر فعلی نتیجه‌ای نیست.' : 'برای هر رشته یک تعرفه تعریف کنید.'}
          action={
            can('price.create') && !items.length ? (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm">
                <Plus className="w-4 h-4" />
                ثبت اولین قیمت
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} rowKey={(r) => r.id} />
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'ویرایش قیمت' : 'قیمت جدید'}>
        <div className="space-y-4">
          <FormField
            label="رشته"
            error={formErrors.sport}
            as="select"
            value={String(form.sport || '')}
            onChange={(e) => setForm((f) => ({ ...f, sport: Number(e.target.value) }))}
            disabled={!!editing}
            options={[
              { value: '', label: availableSportsForCreate.length ? 'انتخاب رشته' : 'همه رشته‌ها تعرفه دارند' },
              ...(editing
                ? sports.filter((s) => s.id === form.sport).map((s) => ({ value: String(s.id), label: s.title || s.name || `#${s.id}` }))
                : availableSportsForCreate.map((s) => ({ value: String(s.id), label: s.title || s.name || `#${s.id}` }))),
            ]}
          />
          <FormField label="قیمت تک‌جلسه (تومان)" error={formErrors.single_session_price} type="number" value={form.single_session_price} onChange={(e) => setForm((f) => ({ ...f, single_session_price: e.target.value }))} />
          <FormField label="قیمت ماهانه (تومان)" error={formErrors.monthly_price} type="number" value={form.monthly_price} onChange={(e) => setForm((f) => ({ ...f, monthly_price: e.target.value }))} />
          <FormField label="قیمت سه‌ماهه (تومان)" error={formErrors.quarterly_price} type="number" value={form.quarterly_price} onChange={(e) => setForm((f) => ({ ...f, quarterly_price: e.target.value }))} />
          <FormField label="قیمت سالانه (تومان)" error={formErrors.yearly_price} type="number" value={form.yearly_price} onChange={(e) => setForm((f) => ({ ...f, yearly_price: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-border text-ink hover:bg-surface-hover text-sm">
              انصراف
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover text-sm font-medium disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات تعرفه">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">رشته</span><span className="font-medium">{sportName(detail.sport)}</span></div>
            <div className="flex justify-between"><span className="text-muted">تک‌جلسه</span><span>{formatPrice(detail.single_session_price)}</span></div>
            <div className="flex justify-between"><span className="text-muted">ماهانه</span><span>{formatPrice(detail.monthly_price)}</span></div>
            <div className="flex justify-between"><span className="text-muted">سه‌ماهه</span><span>{formatPrice(detail.quarterly_price)}</span></div>
            <div className="flex justify-between"><span className="text-muted">سالانه</span><span>{formatPrice(detail.yearly_price)}</span></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="حذف قیمت"
        description={deleting ? `آیا از حذف تعرفه «${sportName(deleting.sport)}» مطمئن هستید؟` : ''}
      />
    </div>
  );
};

export default PricesPage;
