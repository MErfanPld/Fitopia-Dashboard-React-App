import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import sessionsService from '../../services/sessions/sessionsService';
import membersService from '../../services/members/membersService';
import type { GymMember, SingleSession } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

export const SessionsPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('finance.create');
  const { showToast } = useUI();
  const [items, setItems] = useState<SingleSession[]>([]);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try { setItems(await sessionsService.list(gymId)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'دریافت اطلاعات با خطا مواجه شد.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const columns: Column<SingleSession>[] = [
    { key: 'customer', header: 'مشتری', render: (r) => <span className="text-ink">{r.customer}</span> },
    { key: 'price', header: 'قیمت', render: (r) => <span>{r.price.toLocaleString('fa-IR')}</span> },
    { key: 'status', header: 'وضعیت', render: (r) => <span className="text-muted text-xs">{r.status || '—'}</span> },
    { key: 'purchased_at', header: 'خرید', render: (r) => <span className="text-xs text-muted">{formatJalaliDateTime(r.purchased_at)}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="جلسات تکی" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="جلسات تکی" onQuickAction={can('finance.create') ? async () => {
        if (gymId) { try { setMembers(await membersService.list(gymId)); } catch { setMembers([]); } }
        setCustomerId(''); setPrice(''); setOpen(true);
      } : undefined} quickActionLabel={can('finance.create') ? 'ثبت جلسه' : undefined} />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="جلسه‌ای ثبت نشده" />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} data={items} />}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="ثبت جلسه تکی">
        <div className="space-y-4">
          <FormField label="عضو" isSelect required value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={[
            { value: '', label: 'انتخاب' },
            ...members.map((m) => ({ value: String(m.id), label: m.full_name })),
          ]} />
          <FormField label="قیمت" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-fg font-bold rounded-lg" onClick={async () => {
              if (!gymId || !customerId || !price) return;
              setSaving(true);
              try {
                await sessionsService.create(gymId, { customer: Number(customerId), price: Number(price) });
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
