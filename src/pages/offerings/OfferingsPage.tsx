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
import sportsService from '../../services/sports/sportsService';
import type { GymOffering, Sport, SportCategory } from '../../types/api';

export const OfferingsPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('offering.manage');
  const { showToast } = useUI();
  const [items, setItems] = useState<GymOffering[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sportId, setSportId] = useState('');
  const [desc, setDesc] = useState('');
  const [monthly, setMonthly] = useState('');
  const [sportName, setSportName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sp, cats] = await Promise.all([
        offeringsService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
        sportsService.listCategories().catch(() => [] as SportCategory[]),
      ]);
      setItems(list);
      setSports(sp);
      setCategories(cats);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('offering.manage')) load();
  }, [hasGym, load, can]);

  const columns: Column<GymOffering>[] = [
    { key: 'sport_name', header: 'رشته', render: (r) => <span className="text-ink">{r.sport_name || r.sport || '—'}</span> },
    { key: 'description', header: 'توضیح', render: (r) => <span className="text-muted text-xs">{r.description || '—'}</span> },
    { key: 'monthly_price', header: 'ماهانه', render: (r) => <span>{r.monthly_price?.toLocaleString('fa-IR') ?? '—'} تومان</span> },
    { key: 'is_active', header: 'وضعیت', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="خدمات و رشته‌ها" /><NoGymSelected /></div>;
  if (!can('offering.manage')) return <div className="space-y-6"><Header title="خدمات و رشته‌ها" /><EmptyState title="دسترسی ندارید" /></div>;

  return (
    <div className="space-y-6">
      <Header
        title="خدمات و رشته‌ها"
        actions={
          <button
            type="button"
            onClick={() => { setSportName(''); setCategoryId(categories[0] ? String(categories[0].id) : ''); setSuggestOpen(true); }}
            className="px-3 py-2 text-xs rounded-xl border border-border text-muted hover:text-ink hover:bg-surface-hover"
          >
            پیشنهاد رشته جدید
          </button>
        }
        onQuickAction={() => { setSportId(''); setDesc(''); setMonthly(''); setOpen(true); }}
        quickActionLabel="خدمت جدید"
      />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="هنوز خدمتی ثبت نشده است" />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} data={items} />}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="خدمت جدید">
        <div className="space-y-4">
          {sports.length > 0 ? (
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">رشته ورزشی</label>
              <select
                className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
              >
                <option value="">انتخاب رشته</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <FormField label="شناسه رشته (sport)" type="number" value={sportId} onChange={(e) => setSportId(e.target.value)} />
          )}
          <FormField label="توضیحات" isTextarea value={desc} onChange={(e) => setDesc(e.target.value)} />
          <FormField label="قیمت ماهانه (تومان)" type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button
              type="button"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-primary-fg font-bold rounded-lg disabled:opacity-50"
              onClick={async () => {
                if (!gymId) return;
                setSaving(true);
                try {
                  await offeringsService.create(gymId, {
                    sport: sportId ? Number(sportId) : null,
                    description: desc,
                    monthly_price: monthly ? Number(monthly) : null,
                    is_active: true,
                  });
                  showToast('خدمت ثبت شد.', 'success');
                  setOpen(false);
                  load();
                } catch (e: unknown) {
                  showToast(e instanceof Error ? e.message : 'خطا', 'danger');
                } finally {
                  setSaving(false);
                }
              }}
            >
              ذخیره
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={suggestOpen} onClose={() => setSuggestOpen(false)} title="پیشنهاد رشته ورزشی">
        <div className="space-y-4">
          <FormField label="نام رشته" required value={sportName} onChange={(e) => setSportName(e.target.value)} />
          {categories.length > 0 ? (
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">دسته‌بندی</label>
              <select
                className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">انتخاب دسته</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <FormField label="شناسه دسته‌بندی" required type="number" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
          )}
          <p className="text-[11px] text-muted">پیشنهاد برای بررسی تیم فیتوپیا ارسال می‌شود (POST suggest-sport).</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSuggestOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button
              type="button"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-primary-fg font-bold rounded-lg disabled:opacity-50"
              onClick={async () => {
                if (!gymId || !sportName.trim() || !categoryId) {
                  showToast('نام رشته و دسته‌بندی الزامی است.', 'warning');
                  return;
                }
                setSaving(true);
                try {
                  await offeringsService.suggestSport(gymId, { name: sportName.trim(), category_id: Number(categoryId) });
                  showToast('پیشنهاد ارسال شد.', 'success');
                  setSuggestOpen(false);
                } catch (e: unknown) {
                  showToast(e instanceof Error ? e.message : 'خطا', 'danger');
                } finally {
                  setSaving(false);
                }
              }}
            >
              ارسال پیشنهاد
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
