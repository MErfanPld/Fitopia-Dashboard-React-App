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
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'دریافت اطلاعات با خطا مواجه شد.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const columns: Column<GymChangeRequest>[] = [
    { key: 'id', header: 'شماره تیکت', render: (r) => <span className="text-muted text-xs tabular-nums">#{r.id}</span> },
    { key: 'request_type', header: 'نوع', render: (r) => <span className="text-ink text-sm">{r.request_type}</span> },
    { key: 'status', header: 'وضعیت', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'تاریخ', render: (r) => <span className="text-xs text-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString('fa-IR') : '—'}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="تیکت‌ها" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="تیکت‌ها" subtitle="درخواست‌ها و پیام‌ها" />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="تیکتی وجود ندارد" />}
      {!loading && !error && items.length > 0 && (
        <DataTable columns={columns} data={items} actions={(r) => (
          <button type="button" className="text-xs text-primary" onClick={async () => {
            if (!gymId) return;
            try { setDetail(await ticketsService.get(gymId, r.id)); }
            catch { setDetail(r); }
            setReply('');
          }}>مشاهده</button>
        )} />
      )}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? `شماره تیکت ${detail.id}` : 'تیکت'}>
        {detail && (
          <div className="space-y-4">
            <p className="text-sm text-muted">نوع: {detail.request_type}</p>
            <p className="text-sm text-muted">وضعیت: {detail.status}</p>
            {detail.admin_note && <p className="text-sm text-muted">یادداشت ادمین: {detail.admin_note}</p>}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(detail.messages || []).map((m) => (
                <div key={m.id} className="rounded-lg bg-surface-elevated border border-border p-3 text-sm">
                  <p className="text-[10px] text-muted mb-1">{m.sender_role} — {new Date(m.created_at).toLocaleString('fa-IR')}</p>
                  <p className="text-ink">{m.message}</p>
                </div>
              ))}
            </div>
            <FormField label="پاسخ" isTextarea value={reply} onChange={(e) => setReply(e.target.value)} />
            <div className="flex justify-end">
              <button type="button" disabled={sending || !reply.trim()} className="px-4 py-2 text-sm bg-primary text-[#0B0B0F] font-bold rounded-lg disabled:opacity-50" onClick={async () => {
                if (!gymId || !detail) return;
                setSending(true);
                try {
                  await ticketsService.reply(gymId, detail.id, reply);
                  showToast('پیام ارسال شد', 'success');
                  setDetail(await ticketsService.get(gymId, detail.id));
                  setReply(''); load();
                } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'خطا', 'danger'); }
                finally { setSending(false); }
              }}>ارسال</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
