import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import auditService from '../../services/audit/auditService';
import type { AuditLog } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

export const AuditLogsPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try { setItems(await auditService.list(gymId)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'خطا'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'عمل', render: (r) => <span className="text-ink text-sm">{r.action}</span> },
    { key: 'object_type', header: 'نوع', render: (r) => <span className="text-secondary text-sm">{r.object_type || '—'}</span> },
    { key: 'object_id', header: 'شناسه', render: (r) => <span className="text-muted text-xs">{r.object_id || '—'}</span> },
    { key: 'created_at', header: 'زمان', render: (r) => <span className="text-muted text-xs">{formatJalaliDateTime(r.created_at)}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="گزارش فعالیت" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="گزارش فعالیت" onQuickAction={load} quickActionLabel="بروزرسانی" />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="رکوردی یافت نشد" />}
      {!loading && !error && items.length > 0 && (
        <DataTable columns={columns} data={items} searchKeys={['action', 'object_type']} />
      )}
    </div>
  );
};
