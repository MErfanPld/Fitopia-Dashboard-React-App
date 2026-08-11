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
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'دریافت اطلاعات با خطا مواجه شد.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym && can('course.view')) load(); }, [hasGym, load, can]);

  const columns: Column<Course>[] = [
    { key: 'title', header: 'عنوان', render: (r) => <span className="text-ink font-medium">{r.title}</span> },
    { key: 'sport_name', header: 'رشته', render: (r) => <span className="text-muted">{r.sport_name || '—'}</span> },
    { key: 'capacity', header: 'ظرفیت', render: (r) => <span>{r.enrollment_count ?? 0}/{r.capacity ?? '—'}</span> },
    { key: 'price', header: 'قیمت', render: (r) => <span>{r.price?.toLocaleString('fa-IR') ?? '—'}</span> },
    { key: 'status', header: 'وضعیت', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="دوره‌ها" /><NoGymSelected /></div>;
  if (!can('course.view')) return <div className="space-y-6"><Header title="دوره‌ها" /><EmptyState title="دسترسی ندارید" /></div>;

  return (
    <div className="space-y-6">
      <Header title="دوره‌ها" subtitle="دوره‌های آموزشی" onQuickAction={can('course.create') ? () => { setTitle(''); setPrice(''); setCapacity(''); setOpen(true); } : undefined} quickActionLabel={can('course.create') ? 'دوره جدید' : undefined} />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="دوره‌ای ثبت نشده" />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} data={items} searchKeys={['title']} />}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="دوره جدید">
        <div className="space-y-4">
          <FormField label="عنوان" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <FormField label="قیمت" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <FormField label="ظرفیت" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-primary text-[#0B0B0F] font-bold rounded-lg" onClick={async () => {
              if (!gymId || !title.trim()) return;
              setSaving(true);
              try {
                await coursesService.create(gymId, { title, price: price ? Number(price) : null, capacity: capacity ? Number(capacity) : null, is_active: true });
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
