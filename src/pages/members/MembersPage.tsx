import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Trash2, Eye, Phone, RefreshCw } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { FormField } from '../../components/common/FormField';
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
    catch (e: unknown) { setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym && can('customer.view')) load(); }, [hasGym, load, can]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (m: GymMember) => {
    setEditing(m);
    setForm({
      full_name: m.full_name, phone: m.phone, sport: m.sport,
      sessions_total: m.sessions_total, sessions_remaining: m.sessions_remaining,
      price_paid: m.price_paid, join_date: m.join_date || emptyForm.join_date,
      membership_status: m.membership_status || 'active', membership_type: m.membership_type || 'session_pack', notes: m.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!gymId) return;
    if (!form.full_name.trim() || !form.phone.trim()) { showToast('\u0646\u0627\u0645 \u0648 \u0634\u0645\u0627\u0631\u0647 \u062a\u0645\u0627\u0633 \u0627\u0644\u0632\u0627\u0645\u06cc \u0627\u0633\u062a.', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) { await membersService.update(gymId, editing.id, form); showToast('\u0639\u0636\u0648 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc \u0634\u062f.', 'success'); }
      else { await membersService.create(gymId, form); showToast('\u0639\u0636\u0648 \u062c\u062f\u06cc\u062f \u062b\u0628\u062a \u0634\u062f.', 'success'); }
      setModalOpen(false); load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627 \u062f\u0631 \u0630\u062e\u06cc\u0631\u0647', 'danger'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    try { await membersService.remove(gymId, deleting.id); showToast('\u0639\u0636\u0648 \u062d\u0630\u0641 \u0634\u062f.', 'success'); setDeleting(null); load(); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627 \u062f\u0631 \u062d\u0630\u0641', 'danger'); }
  };

  const columns: Column<GymMember>[] = useMemo(() => [
    { key: 'full_name', header: '\u0646\u0627\u0645', render: (r) => <span className="font-medium text-white">{r.full_name}</span> },
    { key: 'phone', header: '\u062a\u0644\u0641\u0646', render: (r) => <span className="flex items-center gap-1 text-slate-300 text-sm"><Phone className="w-3.5 h-3.5" />{r.phone}</span> },
    { key: 'membership_status', header: '\u0648\u0636\u0639\u06cc\u062a', render: (r) => <StatusBadge status={r.membership_status || (r.is_active ? 'active' : 'inactive')} /> },
    { key: 'sessions_remaining', header: '\u062c\u0644\u0633\u0627\u062a \u0628\u0627\u0642\u06cc', render: (r) => <span className="text-sm text-slate-300">{r.sessions_remaining_calc ?? r.sessions_remaining ?? '\u2014'}</span> },
  ], []);

  if (!hasGym) return <div className="space-y-6"><Header title="\u0627\u0639\u0636\u0627" /><NoGymSelected /></div>;
  if (!can('customer.view')) return <div className="space-y-6"><Header title="\u0627\u0639\u0636\u0627" /><EmptyState title="\u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u062f\u0627\u0631\u06cc\u062f" description="\u0645\u062c\u0648\u0632 \u0645\u0634\u0627\u0647\u062f\u0647 \u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0628\u0631\u0627\u06cc \u0646\u0642\u0634 \u0634\u0645\u0627 \u0641\u0639\u0627\u0644 \u0646\u06cc\u0633\u062a." /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u0645\u062f\u06cc\u0631\u06cc\u062a \u0627\u0639\u0636\u0627" subtitle="\u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0628\u0627\u0634\u06af\u0627\u0647" onQuickAction={can('customer.create') ? openCreate : undefined} quickActionLabel={can('customer.create') ? '\u0639\u0636\u0648 \u062c\u062f\u06cc\u062f' : undefined} />
      <div className="flex justify-end">
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2A2A2A] text-slate-300 text-sm"><RefreshCw className="w-4 h-4" />\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc</button>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="\u0639\u0636\u0648\u06cc \u06cc\u0627\u0641\u062a \u0646\u0634\u062f" />}
      {!loading && !error && items.length > 0 && (
        <DataTable columns={columns} data={items} searchKeys={['full_name', 'phone']} actions={(r) => (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setDetail(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#222]"><Eye className="w-4 h-4" /></button>
            {can('customer.update') && <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#FF9D4D] hover:bg-[#222]"><Edit3 className="w-4 h-4" /></button>}
            {can('customer.delete') && <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#222]"><Trash2 className="w-4 h-4" /></button>}
          </div>
        )} />
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0639\u0636\u0648' : '\u062b\u0628\u062a \u0639\u0636\u0648 \u062c\u062f\u06cc\u062f'}>
        <div className="space-y-4">
          <FormField label="\u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <FormField label="\u0634\u0645\u0627\u0631\u0647 \u062a\u0645\u0627\u0633" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <FormField label="\u062a\u0627\u0631\u06cc\u062e \u0639\u0636\u0648\u06cc\u062a" type="date" value={form.join_date || ''} onChange={(e) => setForm({ ...form, join_date: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="\u062a\u0639\u062f\u0627\u062f \u062c\u0644\u0633\u0627\u062a" type="number" value={form.sessions_total ?? ''} onChange={(e) => setForm({ ...form, sessions_total: e.target.value ? Number(e.target.value) : null })} />
            <FormField label="\u0645\u0628\u0644\u063a \u067e\u0631\u062f\u0627\u062e\u062a\u06cc" type="number" value={form.price_paid ?? ''} onChange={(e) => setForm({ ...form, price_paid: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-lg text-slate-300 hover:bg-[#222]">\u0627\u0646\u0635\u0631\u0627\u0641</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-[#FF7A1A] text-white font-medium disabled:opacity-50">{saving ? '...' : '\u0630\u062e\u06cc\u0631\u0647'}</button>
          </div>
        </div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="\u062d\u0630\u0641 \u0639\u0636\u0648" itemName={deleting?.full_name || ''} />
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="\u062c\u0632\u0626\u06cc\u0627\u062a \u0639\u0636\u0648">
        {detail && (
          <div className="space-y-2 text-sm text-slate-300">
            <p><span className="text-slate-500">\u0646\u0627\u0645:</span> {detail.full_name}</p>
            <p><span className="text-slate-500">\u062a\u0644\u0641\u0646:</span> {detail.phone}</p>
            <p><span className="text-slate-500">\u0648\u0636\u0639\u06cc\u062a:</span> {detail.membership_status || '\u2014'}</p>
            <p><span className="text-slate-500">\u062c\u0644\u0633\u0627\u062a \u0628\u0627\u0642\u06cc:</span> {detail.sessions_remaining_calc ?? detail.sessions_remaining ?? '\u2014'}</p>
            <p><span className="text-slate-500">\u0622\u062e\u0631\u06cc\u0646 \u062d\u0636\u0648\u0631:</span> {detail.last_visit_at || '\u2014'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
