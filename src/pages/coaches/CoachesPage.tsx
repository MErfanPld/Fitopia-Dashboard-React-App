import React, { useCallback, useEffect, useState } from 'react';
import { Edit3, Trash2, RefreshCw } from 'lucide-react';
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
import type { GymCoach, GymCoachInput } from '../../types/api';

const emptyForm: GymCoachInput = { full_name: '', specialty: '', image: null };

function CoachAvatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('');
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary-soft border border-border shrink-0 flex items-center justify-center">
        {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-primary">{initials || '—'}</span>}
      </div>
      <span className="font-medium text-ink truncate">{name}</span>
    </div>
  );
}

export const CoachesPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const { showToast } = useUI();
  const [items, setItems] = useState<GymCoach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GymCoach | null>(null);
  const [form, setForm] = useState<GymCoachInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymCoach | null>(null);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await coachesService.list(gymId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym) load();
  }, [hasGym, load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: GymCoach) => {
    setEditing(c);
    setForm({ full_name: c.full_name, specialty: c.specialty || '', image: null });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!gymId) return;
    if (!form.full_name.trim()) {
      showToast('نام مربی الزامی است.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await coachesService.update(gymId, editing.id, form);
        showToast('مربی به‌روزرسانی شد.', 'success');
      } else {
        await coachesService.create(gymId, form);
        showToast('مربی جدید ثبت شد.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ذخیره', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    try {
      await coachesService.remove(gymId, deleting.id);
      showToast('مربی حذف شد.', 'success');
      setDeleting(null);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در حذف', 'danger');
    }
  };

  const columns: Column<GymCoach>[] = [
    { key: 'full_name', header: 'مربی', render: (r) => <CoachAvatar name={r.full_name} image={r.image} /> },
    { key: 'specialty', header: 'تخصص', render: (r) => <span className="text-muted text-sm">{r.specialty || '—'}</span> },
  ];

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="مربیان" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="مربیان" onQuickAction={openCreate} quickActionLabel="مربی جدید" />
      <div className="flex justify-end">
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-ink hover:bg-surface-hover">
          <RefreshCw className="w-4 h-4" />
          به‌روزرسانی
        </button>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="هنوز مربی‌ای ثبت نشده است" description="برای شروع، مربی جدید اضافه کنید." />}
      {!loading && !error && items.length > 0 && (
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['full_name', 'specialty']}
          actions={(r) => (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover" title="ویرایش">
                <Edit3 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-surface-hover" title="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'ویرایش مربی' : 'ثبت مربی جدید'}>
        <div className="space-y-4">
          <ImageUpload mode="avatar" label="تصویر پروفایل" value={editing?.image} file={form.image instanceof File ? form.image : null} onChange={(file) => setForm((prev) => ({ ...prev, image: file }))} />
          <FormField label="نام و نام خانوادگی" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <FormField label="تخصص" value={form.specialty || ''} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="مثلاً بدنسازی، یوگا" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="حذف مربی" itemName={deleting?.full_name || ''} />
    </div>
  );
};
