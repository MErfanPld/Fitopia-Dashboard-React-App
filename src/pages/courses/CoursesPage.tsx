import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import coursesService from '../../services/courses/coursesService';
import type { Course } from '../../types/api';

export const CoursesPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('course.view');
  const { showToast } = useUI();
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try { setItems(await coursesService.list(gymId)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym && can('course.view')) load(); }, [hasGym, load, can]);

  const columns: Column<Course>[] = [
    { key: 'title', header: '\u0639\u0646\u0648\u0627\u0646', render: (r) => <span className="text-white font-medium">{r.title}</span> },
    { key: 'sport_name', header: '\u0631\u0634\u062a\u0647', render: (r) => <span className="text-slate-300">{r.sport_name || '\u2014'}</span> },
    { key: 'capacity', header: '\u0638\u0631\u0641\u06cc\u062a', render: (r) => <span>{r.enrollment_count ?? 0}/{r.capacity ?? '\u2014'}</span> },
    { key: 'price', header: '\u0642\u06cc\u0645\u062a', render: (r) => <span>{r.price?.toLocaleString('fa-IR') ?? '\u2014'}</span> },
    { key: 'status', header: '\u0648\u0636\u0639\u06cc\u062a', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} customLabel={r.status} /> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="\u062f\u0648\u0631\u0647\u200c\u0647\u0627" /><NoGymSelected /></div>;
  if (!can('course.view')) return <div className="space-y-6"><Header title="\u062f\u0648\u0631\u0647\u200c\u0647\u0627" /><EmptyState title="\u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u062f\u0627\u0631\u06cc\u062f" /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u062f\u0648\u0631\u0647\u200c\u0647\u0627" subtitle="\u062f\u0648\u0631\u0647\u200c\u0647\u0627\u06cc \u0622\u0645\u0648\u0632\u0634\u06cc \u0628\u0627\u0634\u06af\u0627\u0647" onQuickAction={can('course.create') ? () => { setTitle(''); setPrice(''); setCapacity(''); setOpen(true); } : undefined} quickActionLabel={can('course.create') ? '\u062f\u0648\u0631\u0647 \u062c\u062f\u06cc\u062f' : undefined} />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="\u062f\u0648\u0631\u0647\u200c\u0627\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647" />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} data={items} searchKeys={['title']} />}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="\u062f\u0648\u0631\u0647 \u062c\u062f\u06cc\u062f">
        <div className="space-y-4">
          <FormField label="\u0639\u0646\u0648\u0627\u0646" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <FormField label="\u0642\u06cc\u0645\u062a" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <FormField label="\u0638\u0631\u0641\u06cc\u062a" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-300">\u0627\u0646\u0635\u0631\u0627\u0641</button>
            <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg" onClick={async () => {
              if (!gymId || !title.trim()) return;
              setSaving(true);
              try {
                await coursesService.create(gymId, { title, price: price ? Number(price) : null, capacity: capacity ? Number(capacity) : null, is_active: true });
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
