import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Trash2, Eye, Phone, RefreshCw } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import membersService from '../../services/members/membersService';
import type { GymMember, GymMemberInput } from '../../types/api';

const emptyForm: GymMemberInput = {
  full_name: '', phone: '',
  join_date: new Date().toISOString().slice(0, 10),
  membership_status: 'active', membership_type: 'session_pack',
};

export const MembersPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('customer.view');
  const { showToast } = useUI();
  const [items, setItems] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GymMember | null>(null);
  const [form, setForm] = useState<GymMemberInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymMember | null>(null);
  const [detail, setDetail] = useState<GymMember | null>(null);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try { setItems(await membersService.list(gymId)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'خطا در دریافت اطلاعات'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym && can('customer.view')) load(); }, [hasGym, load, can]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (m: GymMember) => {
    setEditing(m);
    setForm({
      full_name: m.full_name, phone: m.phone, sport: m.sport,
      sessions_total: m.sessions_total, sessions_remaining: m.sessions_remaining,
      price_paid: m.price_paid, join_date: m.join_date || '',
      membership_status: m.membership_status || 'active',
      membership_type: m.membership_type || 'session_pack', notes: m.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!gymId) return;
    if (!form.full_name.trim() || !form.phone.trim()) {
      showToast('نام و تلفن الزامی است.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await membersService.update(gymId, editing.id, form);
        showToast('عضو به‌روزرسانی شد.', 'success');
      } else {
        await membersService.create(gymId, form);
        showToast('عضو ثبت شد.', 'success');
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
      await membersService.remove(gymId, deleting.id);
      showToast('حذف شد.', 'success');
      setDeleting(null);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در حذف', 'danger');
    }
  };

  const columns: Column<GymMember>[] = [
    { key: 'full_name', header: 'نام', render: (r) => <span className="text-ink font-medium">{r.full_name}</span> },
    { key: 'phone', header: 'تلفن', render: (r) => <span className="text-muted text-sm dir-ltr">{r.phone}</span> },
    { key: 'sport_name', header: 'رشته', render: (r) => <span className="text-muted">{r.sport_name || '—'}</span> },
    { key: 'membership_status', header: 'وضعیت', render: (r) => <StatusBadge status={r.membership_status || 'active'} /> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="مدیریت اعضا" /><NoGymSelected /></div>;
  if (!can('customer.view')) return <div className="space-y-6"><Header title="مدیریت اعضا" /><EmptyState title="دسترسی ندارید" /></div>;

  return (
    <div className="space-y-6">
      <Header title="مدیریت اعضا" onQuickAction={can('customer.create') ? openCreate : undefined} quickActionLabel={can('customer.create') ? 'عضو جدید' : undefined} />
      <div className="flex justify-end">
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-ink hover:bg-surface-hover">
          <RefreshCw className="w-4 h-4" /> به‌روزرسانی
        </button>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="هنوز عضوی ثبت نشده است" />}
      {!loading && !error && items.length > 0 && (
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['full_name', 'phone']}
          actions={(r) => (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-elevated"><Eye className="w-4 h-4" /></button>
              {can('customer.update') && <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-elevated"><Edit3 className="w-4 h-4" /></button>}
              {can('customer.delete') && <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-surface-elevated"><Trash2 className="w-4 h-4" /></button>}
            </div>
          )}
        />
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'ویرایش عضو' : 'ثبت عضو جدید'}>
        <div className="space-y-4">
          <FormField label="نام و نام خانوادگی" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <FormField label="شماره تماس" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <JalaliDatePicker label="تاریخ عضویت" value={form.join_date || ''} onChange={(v) => setForm({ ...form, join_date: v })} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="تعداد جلسات" type="number" value={form.sessions_total ?? ''} onChange={(e) => setForm({ ...form, sessions_total: e.target.value ? Number(e.target.value) : null })} />
            <FormField label="مبلغ پرداختی" type="number" value={form.price_paid ?? ''} onChange={(e) => setForm({ ...form, price_paid: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-elevated">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-medium disabled:opacity-50">{saving ? '...' : 'ذخیره'}</button>
          </div>
        </div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="حذف عضو" itemName={deleting?.full_name || ''} />
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات عضو">
        {detail && (
          <div className="space-y-2 text-sm text-muted">
            <p><span className="text-disabled">نام:</span> {detail.full_name}</p>
            <p><span className="text-disabled">تلفن:</span> {detail.phone}</p>
            <p><span className="text-disabled">وضعیت:</span> {detail.membership_status || '—'}</p>
            <p><span className="text-disabled">جلسات باقی:</span> {detail.sessions_remaining_calc ?? detail.sessions_remaining ?? '—'}</p>
            <p><span className="text-disabled">آخرین حضور:</span> {detail.last_visit_at || '—'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
