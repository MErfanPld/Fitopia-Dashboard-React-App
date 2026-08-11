import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import ticketsService from '../../services/tickets/ticketsService';
import type { GymChangeRequest } from '../../types/api';

export const TicketsPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const { showToast } = useUI();
  const [items, setItems] = useState<GymChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<GymChangeRequest | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try { setItems(await ticketsService.list(gymId)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const columns: Column<GymChangeRequest>[] = [
    { key: 'id', header: '#', render: (r) => <span className="text-slate-400">{r.id}</span> },
    { key: 'request_type', header: '\u0646\u0648\u0639', render: (r) => <span className="text-white text-sm">{r.request_type}</span> },
    { key: 'status', header: '\u0648\u0636\u0639\u06cc\u062a', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: '\u062a\u0627\u0631\u06cc\u062e', render: (r) => <span className="text-xs text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleDateString('fa-IR') : '\u2014'}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="\u062a\u06cc\u06a9\u062a\u200c\u0647\u0627" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u062a\u06cc\u06a9\u062a\u200c\u0647\u0627 \u0648 \u062f\u0631\u062e\u0648\u0627\u0633\u062a\u200c\u0647\u0627" subtitle="\u062f\u0631\u062e\u0648\u0627\u0633\u062a\u200c\u0647\u0627\u06cc \u062a\u063a\u06cc\u06cc\u0631 \u0648 \u067e\u06cc\u0627\u0645\u200c\u0647\u0627" />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="\u062a\u06cc\u06a9\u062a\u06cc \u0648\u062c\u0648\u062f \u0646\u062f\u0627\u0631\u062f" />}
      {!loading && !error && items.length > 0 && (
        <DataTable columns={columns} data={items} actions={(r) => (
          <button type="button" className="text-xs text-[#FF9D4D]" onClick={async () => {
            if (!gymId) return;
            try { setDetail(await ticketsService.get(gymId, r.id)); }
            catch { setDetail(r); }
            setReply('');
          }}>\u0645\u0634\u0627\u0647\u062f\u0647</button>
        )} />
      )}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`\u062a\u06cc\u06a9\u062a #${detail?.id || ''}`}>
        {detail && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">\u0646\u0648\u0639: {detail.request_type}</p>
            <p className="text-sm text-slate-300">\u0648\u0636\u0639\u06cc\u062a: {detail.status}</p>
            {detail.admin_note && <p className="text-sm text-slate-400">\u06cc\u0627\u062f\u062f\u0627\u0634\u062a \u0627\u062f\u0645\u06cc\u0646: {detail.admin_note}</p>}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(detail.messages || []).map((m) => (
                <div key={m.id} className="rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] p-3 text-sm">
                  <p className="text-[10px] text-slate-500 mb-1">{m.sender_role} — {new Date(m.created_at).toLocaleString('fa-IR')}</p>
                  <p className="text-slate-200">{m.message}</p>
                </div>
              ))}
            </div>
            <FormField label="\u067e\u0627\u0633\u062e" isTextArea value={reply} onChange={(e) => setReply(e.target.value)} />
            <div className="flex justify-end">
              <button type="button" disabled={sending || !reply.trim()} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg disabled:opacity-50" onClick={async () => {
                if (!gymId || !detail) return;
                setSending(true);
                try {
                  await ticketsService.reply(gymId, detail.id, reply);
                  showToast('\u067e\u06cc\u0627\u0645 \u0627\u0631\u0633\u0627\u0644 \u0634\u062f', 'success');
                  setDetail(await ticketsService.get(gymId, detail.id));
                  setReply(''); load();
                } catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger'); }
                finally { setSending(false); }
              }}>\u0627\u0631\u0633\u0627\u0644</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
