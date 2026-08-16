import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Trash2, Eye, RefreshCw, UserPlus, User } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { FormField } from '../../components/common/FormField';
import { ImageUpload } from '../../components/common/ImageUpload';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import coachesService from '../../services/coaches/coachesService';
import sportsService from '../../services/sports/sportsService';
import type { GymCoach, GymCoachInput, Sport } from '../../types/api';

const emptyForm: GymCoachInput = {
  full_name: '',
  specialty: '',
  sports: [],
  image: null,
};

function CoachAvatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary-soft border border-border shrink-0 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : initials ? (
          <span className="text-xs font-bold text-primary">{initials}</span>
        ) : (
          <User className="w-4 h-4 text-primary" />
        )}
      </div>
      <span className="font-medium text-ink truncate">{name}</span>
    </div>
  );
}

function validateForm(form: GymCoachInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.full_name.trim()) errors.full_name = 'نام و نام خانوادگی الزامی است.';
  if (!form.specialty?.trim()) errors.specialty = 'تخصص الزامی است.';
  return errors;
}

function DetailRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-ink font-medium text-left ${ltr ? 'dir-ltr font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export const CoachesPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const { showToast } = useUI();
  const [items, setItems] = useState<GymCoach[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GymCoach | null>(null);
  const [form, setForm] = useState<GymCoachInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymCoach | null>(null);
  const [detail, setDetail] = useState<GymCoach | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  /** Existing image URL when editing (kept until user replaces/removes) */
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const sportNameById = useMemo(() => {
    const map = new Map<number, string>();
    sports.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sports]);

  const resolveSportNames = useCallback(
    (ids?: number[] | null) => {
      if (!ids || !ids.length) return '—';
      return ids.map((id) => sportNameById.get(id) || `رشته ${id}`).join('، ');
    },
    [sportNameById],
  );

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sp] = await Promise.all([
        coachesService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setItems(list);
      setSports(sp);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'دریافت اطلاعات مربیان با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym) load();
  }, [hasGym, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        (r.specialty || '').toLowerCase().includes(q) ||
        resolveSportNames(r.sports).toLowerCase().includes(q),
    );
  }, [items, search, resolveSportNames]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sports: [] });
    setFormErrors({});
    setExistingImageUrl(null);
    setModalOpen(true);
  };

  const openEdit = async (c: GymCoach) => {
    if (!gymId) return;
    setEditing(c);
    setFormErrors({});
    setForm({
      full_name: c.full_name,
      specialty: c.specialty || '',
      sports: c.sports ? [...c.sports] : [],
      image: null,
    });
    setExistingImageUrl(c.image || null);
    setModalOpen(true);
    try {
      const full = await coachesService.get(gymId, c.id);
      setForm({
        full_name: full.full_name,
        specialty: full.specialty || '',
        sports: full.sports ? [...full.sports] : [],
        image: null,
      });
      setExistingImageUrl(full.image || null);
      setEditing(full);
    } catch {
      /* keep list row data */
    }
  };

  const openDetail = async (c: GymCoach) => {
    setDetail(c);
    if (!gymId) return;
    setDetailLoading(true);
    try {
      setDetail(await coachesService.get(gymId, c.id));
    } catch {
      /* keep list row */
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleSport = (sportId: number) => {
    setForm((prev) => {
      const current = prev.sports || [];
      const next = current.includes(sportId)
        ? current.filter((id) => id !== sportId)
        : [...current, sportId];
      return { ...prev, sports: next };
    });
  };

  const handleSave = async () => {
    if (!gymId) return;
    const errs = validateForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length) {
      showToast(Object.values(errs)[0], 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload: GymCoachInput = {
        full_name: form.full_name.trim(),
        specialty: (form.specialty || '').trim(),
        sports: form.sports || [],
        image: form.image instanceof File ? form.image : null,
      };
      if (editing) {
        await coachesService.update(gymId, editing.id, payload);
        showToast('اطلاعات مربی با موفقیت ویرایش شد', 'success');
      } else {
        await coachesService.create(gymId, payload);
        showToast('مربی با موفقیت اضافه شد', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    try {
      await coachesService.remove(gymId, deleting.id);
      showToast('مربی با موفقیت حذف شد', 'success');
      setDeleting(null);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در حذف مربی', 'danger');
    }
  };

  const columns: Column<GymCoach>[] = [
    {
      key: 'full_name',
      header: 'مربی',
      render: (r) => <CoachAvatar name={r.full_name} image={r.image} />,
    },
    {
      key: 'specialty',
      header: 'تخصص',
      render: (r) => <span className="text-muted text-sm">{r.specialty || '—'}</span>,
    },
    {
      key: 'sports',
      header: 'رشته‌ها',
      render: (r) => (
        <span className="text-ink text-sm line-clamp-2">{resolveSportNames(r.sports)}</span>
      ),
    },
  ];

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="مربیان" subtitle="مدیریت مربیان باشگاه" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="مربیان"
        subtitle="مدیریت مربیان باشگاه"
        onQuickAction={openCreate}
        quickActionLabel="افزودن مربی"
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی نام، تخصص یا رشته..."
          className="w-full max-w-md rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-ink placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          aria-label="جستجوی مربی"
        />
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-ink hover:bg-surface-hover shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          به‌روزرسانی
        </button>
      </div>

      {loading && <LoadingBlock />}
      {error && (
        <ErrorBlock
          message={error || 'دریافت اطلاعات مربیان با خطا مواجه شد'}
          onRetry={load}
        />
      )}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="هنوز مربی‌ای ثبت نشده است"
          description="اولین مربی باشگاه را اضافه کنید."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-fg text-sm font-bold"
            >
              <UserPlus className="w-4 h-4" />
              افزودن مربی
            </button>
          }
        />
      )}
      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <EmptyState title="نتیجه‌ای یافت نشد" description="عبارت جستجو را تغییر دهید." />
      )}
      {!loading && !error && filtered.length > 0 && (
        <DataTable
          columns={columns}
          data={filtered}
          actions={(r) => (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => openDetail(r)}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover"
                title="مشاهده"
                aria-label="مشاهده جزئیات مربی"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover"
                title="ویرایش"
                aria-label="ویرایش مربی"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(r)}
                className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-surface-hover"
                title="حذف"
                aria-label="حذف مربی"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'ویرایش مربی' : 'افزودن مربی'}
      >
        <div className="space-y-4">
          <ImageUpload
            mode="avatar"
            label="تصویر پروفایل"
            value={existingImageUrl}
            file={form.image instanceof File ? form.image : null}
            onChange={(file) => {
              setForm((prev) => ({ ...prev, image: file }));
              if (file) setExistingImageUrl(null);
            }}
            onClearUrl={() => setExistingImageUrl(null)}
          />

          <FormField
            label="نام و نام خانوادگی"
            required
            value={form.full_name}
            error={formErrors.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />

          <FormField
            label="تخصص"
            required
            value={form.specialty || ''}
            error={formErrors.specialty}
            placeholder="مثلاً بدنسازی، یوگا، کراس‌فیت"
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary">رشته‌های ورزشی</label>
            {sports.length === 0 ? (
              <p className="text-[11px] text-muted">فهرست رشته‌ها در دسترس نیست.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl border border-border bg-surface-elevated">
                {sports.map((s) => {
                  const checked = (form.sports || []).includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'bg-primary-soft text-primary border border-primary/30'
                          : 'text-ink hover:bg-surface-hover border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleSport(s.id)}
                      />
                      <span
                        className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${
                          checked ? 'bg-primary border-primary' : 'border-border bg-input'
                        }`}
                        aria-hidden
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-primary-fg" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{s.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-muted">می‌توانید چند رشته را انتخاب کنید.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات مربی">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-soft border border-border flex items-center justify-center">
                {detail.image ? (
                  <img src={detail.image} alt={detail.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>
            <DetailRow label="شناسه" value={String(detail.id)} ltr />
            <DetailRow label="نام" value={detail.full_name} />
            <DetailRow label="تخصص" value={detail.specialty || '—'} />
            <DetailRow label="رشته‌ها" value={resolveSportNames(detail.sports)} />
            {detail.image && (
              <DetailRow label="تصویر" value={detail.image} ltr />
            )}
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="حذف مربی"
        itemName={deleting?.full_name || ''}
      />
    </div>
  );
};
