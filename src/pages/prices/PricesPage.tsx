import React, { useCallback, useEffect, useState } from 'react';
import { Edit3, Trash2, RefreshCw } from 'lucide-react';
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

const emptyForm: GymPriceInput = {
  sport: 0,
  session_price: null,
  monthly_price: 0,
  quarterly_price: null,
  yearly_price: 0,
};

export const PricesPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('offering.manage');
  const { showToast } = useUI();
  const [items, setItems] = useState<GymPrice[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GymPrice | null>(null);
  const [form, setForm] = useState<GymPriceInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymPrice | null>(null);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sp] = await Promise.all([
        pricesService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setItems(list);
      setSports(sp);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('offering.manage')) load();
  }, [hasGym, load, can]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: GymPrice) => {
    setEditing(p);
    setForm({
      sport: p.sport,
      session_price: p.session_price ?? null,
      monthly_price: p.monthly_price,
      quarterly_price: p.quarterly_price ?? null,
      yearly_price: p.yearly_price,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!gymId) return;
    if (!form.sport || form.monthly_price == null || form.yearly_price == null) {
      showToast('رشته ورزشی، قیمت ماهانه و سالانه الزامی است.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await pricesService.update(gymId, editing.id, form);
        showToast('قیمت به‌روزرسانی شد.', 'success');
      } else {
        await pricesService.create(gymId, form);
        showToast('قیمت ثبت شد.', 'success');
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ذخیره', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    try {
      await pricesService.remove(gymId, deleting.id);
      showToast('حذف شد.', 'success');
      setDeleting(null);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در حذف', 'danger');
    }
  };

  const money = (n?: number | null) => (n == null ? '—' : n.toLocaleString('fa-IR'));

  const columns: Column<GymPrice>[] = [
    { key: 'sport_name', header: 'رشته ورزشی', render: (r) => <span className="text-ink font-medium">{r.sport_name || sports.find(s => s.id === r.sport)?.name || 'نامشخص'}</span> },
    { key: 'session_price', header: 'تک‌جلسه', render: (r) => <span className="text-muted">{money(r.session_price)}</span> },
    { key: 'monthly_price', header: 'ماهانه', render: (r) => <span>{money(r.monthly_price)}</span> },
    { key: 'quarterly_price', header: 'سه‌ماهه', render: (r) => <span className="text-muted">{money(r.quarterly_price)}</span> },
    { key: 'yearly_price', header: 'سالانه', render: (r) => <span>{money(r.yearly_price)}</span> },
  ];

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="قیمت‌ها" />
        <NoGymSelected />
      </div>
    );
  }
  if (!can('offering.manage')) {
    return (
      <div className="space-y-6">
        <Header title="قیمت‌ها" />
        <EmptyState title="دسترسی ندارید" description="مجوز مدیریت قیمت‌ها برای نقش شما فعال نیست." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="قیمت‌ها" onQuickAction={openCreate} quickActionLabel="قیمت جدید" />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-ink hover:bg-surface-hover"
        >
          <RefreshCw className="w-4 h-4" />
          به‌روزرسانی
        </button>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="هنوز قیمتی ثبت نشده است" description="قیمت‌های رشته‌ها را اضافه کنید." />
      )}
      {!loading && !error && items.length > 0 && (
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['sport_name']}
          actions={(r) => (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover">
                <Edit3 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-surface-hover">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'ویرایش قیمت' : 'ثبت قیمت'}>
        <div className="space-y-4">
          {sports.length > 0 ? (
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">رشته ورزشی</label>
              <select
                className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
                value={form.sport || ''}
                onChange={(e) => setForm({ ...form, sport: Number(e.target.value) || 0 })}
              >
                <option value="">انتخاب رشته</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-muted rounded-xl border border-border bg-surface p-3">فهرست رشته‌ها در دسترس نیست.</p>
          )}
          <FormField label="قیمت تک‌جلسه" type="number" value={form.session_price ?? ''} onChange={(e) => setForm({ ...form, session_price: e.target.value ? Number(e.target.value) : null })} />
          <FormField label="قیمت ماهانه" required type="number" value={form.monthly_price || ''} onChange={(e) => setForm({ ...form, monthly_price: Number(e.target.value) || 0 })} />
          <FormField label="قیمت سه‌ماهه" type="number" value={form.quarterly_price ?? ''} onChange={(e) => setForm({ ...form, quarterly_price: e.target.value ? Number(e.target.value) : null })} />
          <FormField label="قیمت سالانه" required type="number" value={form.yearly_price || ''} onChange={(e) => setForm({ ...form, yearly_price: Number(e.target.value) || 0 })} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? 'در حال ذخیره...' : 'ذخیره'}</button>
          </div>
        </div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="حذف قیمت" itemName={deleting?.sport_name || ''} />
    </div>
  );
};
