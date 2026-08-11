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
    catch (e: unknown) { setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym && can('offering.manage')) load(); }, [hasGym, load, can]);

  const columns: Column<GymOffering>[] = [
    { key: 'sport_name', header: '\u0631\u0634\u062a\u0647', render: (r) => <span className="text-white">{r.sport_name || r.sport || '\u2014'}</span> },
    { key: 'description', header: '\u062a\u0648\u0636\u06cc\u062d', render: (r) => <span className="text-slate-300 text-xs">{r.description || '\u2014'}</span> },
    { key: 'monthly_price', header: '\u0645\u0627\u0647\u0627\u0646\u0647', render: (r) => <span>{r.monthly_price?.toLocaleString('fa-IR') ?? '\u2014'}</span> },
    { key: 'is_active', header: '\u0648\u0636\u0639\u06cc\u062a', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="\u062e\u062f\u0645\u0627\u062a" /><NoGymSelected /></div>;
  if (!can('offering.manage')) return <div className="space-y-6"><Header title="\u062e\u062f\u0645\u0627\u062a" /><EmptyState title="\u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u062f\u0627\u0631\u06cc\u062f" /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u062e\u062f\u0645\u0627\u062a \u0648 \u0631\u0634\u062a\u0647\u200c\u0647\u0627" subtitle="\u0622\u0641\u0631\u06cc\u0646\u06af\u200c\u0647\u0627\u06cc \u0628\u0627\u0634\u06af\u0627\u0647" onQuickAction={() => { setDesc(''); setMonthly(''); setOpen(true); }} quickActionLabel="\u062e\u062f\u0645\u062a \u062c\u062f\u06cc\u062f" />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="\u062e\u062f\u0645\u062a\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647" />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} data={items} />}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="\u062e\u062f\u0645\u062a \u062c\u062f\u06cc\u062f">
        <div className="space-y-4">
          <FormField label="\u062a\u0648\u0636\u06cc\u062d\u0627\u062a" isTextArea value={desc} onChange={(e) => setDesc(e.target.value)} />
          <FormField label="\u0642\u06cc\u0645\u062a \u0645\u0627\u0647\u0627\u0646\u0647" type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-300">\u0627\u0646\u0635\u0631\u0627\u0641</button>
            <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg" onClick={async () => {
              if (!gymId) return;
              setSaving(true);
              try {
                await offeringsService.create(gymId, { description: desc, monthly_price: monthly ? Number(monthly) : null, is_active: true });
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
