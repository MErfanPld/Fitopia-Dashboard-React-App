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
    catch (e: unknown) { setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const columns: Column<SingleSession>[] = [
    { key: 'customer', header: '\u0645\u0634\u062a\u0631\u06cc', render: (r) => <span className="text-white">{r.customer}</span> },
    { key: 'price', header: '\u0642\u06cc\u0645\u062a', render: (r) => <span>{r.price.toLocaleString('fa-IR')}</span> },
    { key: 'status', header: '\u0648\u0636\u0639\u06cc\u062a', render: (r) => <span className="text-slate-300 text-xs">{r.status || '\u2014'}</span> },
    { key: 'purchased_at', header: '\u062e\u0631\u06cc\u062f', render: (r) => <span className="text-xs text-slate-400">{r.purchased_at ? new Date(r.purchased_at).toLocaleString('fa-IR') : '\u2014'}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="\u062c\u0644\u0633\u0627\u062a \u062a\u06a9\u06cc" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u062c\u0644\u0633\u0627\u062a \u062a\u06a9\u06cc" subtitle="\u062e\u0631\u06cc\u062f \u062c\u0644\u0633\u0647 \u062a\u06a9\u06cc" onQuickAction={can('finance.create') ? async () => {
        if (gymId) { try { setMembers(await membersService.list(gymId)); } catch { setMembers([]); } }
        setCustomerId(''); setPrice(''); setOpen(true);
      } : undefined} quickActionLabel={can('finance.create') ? '\u062b\u0628\u062a \u062c\u0644\u0633\u0647' : undefined} />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="\u062c\u0644\u0633\u0647\u200c\u0627\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647" />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} data={items} />}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="\u062b\u0628\u062a \u062c\u0644\u0633\u0647 \u062a\u06a9\u06cc">
        <div className="space-y-4">
          <FormField label="\u0639\u0636\u0648" isSelect required value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={[
            { value: '', label: '\u0627\u0646\u062a\u062e\u0627\u0628' },
            ...members.map((m) => ({ value: String(m.id), label: m.full_name })),
          ]} />
          <FormField label="\u0642\u06cc\u0645\u062a" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-300">\u0627\u0646\u0635\u0631\u0627\u0641</button>
            <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg" onClick={async () => {
              if (!gymId || !customerId || !price) return;
              setSaving(true);
              try {
                await sessionsService.create(gymId, { customer: Number(customerId), price: Number(price) });
                showToast('\u062b\u0628\u062a \u0634\u062f', 'success'); setOpen(false); load();
              } catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger'); }
              finally { setSaving(false); }
            }}>\u0630\u062e\u06cc\u0631\u0647</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
