import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import offeringsService from '../../services/offerings/offeringsService';
import type { GymOffering } from '../../types/api';

export const OfferingsPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('offering.manage');
  const { showToast } = useUI();
  const [items, setItems] = useState<GymOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [monthly, setMonthly] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try { setItems(await offeringsService.list(gymId)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'دریافت اطلاعات با خطا مواجه شد.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym && can('offering.manage')) load(); }, [hasGym, load, can]);

  const columns: Column<GymOffering>[] = [
    { key: 'sport_name', header: 'رشته', render: (r) => <span className="text-ink">{r.sport_name || r.sport || '—'}</span> },
    { key: 'description', header: 'توضیح', render: (r) => <span className="text-muted text-xs">{r.description || '—'}</span> },
    { key: 'monthly_price', header: 'ماهانه', render: (r) => <span>{r.monthly_price?.toLocaleString('fa-IR') ?? '—'}</span> },
    { key: 'is_active', header: 'وضعیت', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="خدمات" /><NoGymSelected /></div>;
  if (!can('offering.manage')) return <div className="space-y-6"><Header title="خدمات" /><EmptyState title="دسترسی ندارید" /></div>;

  return (
    <div className="space-y-6">
      <Header title="خدمات" subtitle="خدمات و رشته‌های باشگاه" onQuickAction={() => { setDesc(''); setMonthly(''); setOpen(true); }} quickActionLabel="خدمت جدید" />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="خدمتی ثبت نشده" />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} data={items} />}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="خدمت جدید">
        <div className="space-y-4">
          <FormField label="توضیحات" isTextarea value={desc} onChange={(e) => setDesc(e.target.value)} />
          <FormField label="قیمت ماهانه" type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-primary text-[#0B0B0F] font-bold rounded-lg" onClick={async () => {
              if (!gymId) return;
              setSaving(true);
              try {
                await offeringsService.create(gymId, { description: desc, monthly_price: monthly ? Number(monthly) : null, is_active: true });
                showToast('ثبت شد', 'success'); setOpen(false); load();
              } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'خطا', 'danger'); }
              finally { setSaving(false); }
            }}>ذخیره</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
