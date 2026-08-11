import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import auditService from '../../services/audit/auditService';
import type { AuditLog } from '../../types/api';

export const AuditLogsPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await auditService.list(gymId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '\u062e\u0637\u0627');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym) load();
  }, [hasGym, load]);

  const columns: Column<AuditLog>[] = [
    { key: 'created_at', header: '\u0632\u0645\u0627\u0646', render: (r) => <span className="text-slate-300 text-xs">{r.created_at || '\u2014'}</span> },
    { key: 'action', header: '\u0639\u0645\u0644', render: (r) => <span className="text-white">{r.action}</span> },
    { key: 'object_type', header: '\u0646\u0648\u0639', render: (r) => <span className="text-slate-300">{r.object_type || '\u2014'}</span> },
    { key: 'user', header: '\u06a9\u0627\u0631\u0628\u0631', render: (r) => <span className="text-slate-400">{r.user ?? '\u2014'}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="\u06af\u0632\u0627\u0631\u0634 \u0641\u0639\u0627\u0644\u06cc\u062a" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u06af\u0632\u0627\u0631\u0634 \u0641\u0639\u0627\u0644\u06cc\u062a" subtitle="\u0633\u062c\u0644 \u062e\u0648\u0627\u0646\u062f\u0646\u06cc \u0627\u0639\u0645\u0627\u0644 \u0628\u0627\u0634\u06af\u0627\u0647" onQuickAction={load} quickActionLabel="\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc" />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="\u0633\u062c\u0644\u06cc \u0648\u062c\u0648\u062f \u0646\u062f\u0627\u0631\u062f" />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} data={items} searchKeys={['action', 'object_type']} />}
    </div>
  );
};
