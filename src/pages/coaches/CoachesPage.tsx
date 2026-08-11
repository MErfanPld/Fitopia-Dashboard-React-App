import React, { useCallback, useEffect, useState } from 'react';
import { Edit3, Trash2, RefreshCw } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { FormField } from '../../components/common/FormField';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import coachesService from '../../services/coaches/coachesService';
import type { GymCoach } from '../../types/api';

export const CoachesPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const { showToast } = useUI();
  const [items, setItems] = useState<GymCoach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GymCoach | null>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymCoach | null>(null);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try { setItems(await coachesService.list(gymId)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const save = async () => {
    if (!gymId || !name.trim()) return;
    setSaving(true);
    try {
      if (editing) await coachesService.update(gymId, editing.id, { full_name: name, specialty });
      else await coachesService.create(gymId, { full_name: name, specialty });
      showToast('\u0630\u062e\u06cc\u0631\u0647 \u0634\u062f.', 'success');
      setOpen(false); load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger'); }
    finally { setSaving(false); }
  };

  const columns: Column<GymCoach>[] = [
    { key: 'full_name', header: '\u0646\u0627\u0645', render: (r) => <span className="text-white font-medium">{r.full_name}</span> },
    { key: 'specialty', header: '\u062a\u062e\u0635\u0635', render: (r) => <span className="text-slate-300">{r.specialty || '\u2014'}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="\u0645\u0631\u0628\u06cc\u0627\u0646" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u0645\u0631\u0628\u06cc\u0627\u0646" subtitle="\u0645\u062f\u06cc\u0631\u06cc\u062a \u0645\u0631\u0628\u06cc\u0627\u0646 \u0628\u0627\u0634\u06af\u0627\u0647" onQuickAction={() => { setEditing(null); setName(''); setSpecialty(''); setOpen(true); }} quickActionLabel="\u0645\u0631\u0628\u06cc \u062c\u062f\u06cc\u062f" />
      <div className="flex justify-end"><button type="button" onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#2A2A2A] rounded-lg text-slate-300"><RefreshCw className="w-4 h-4" />\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc</button></div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="\u0645\u0631\u0628\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647" />}
      {!loading && !error && items.length > 0 && (
        <DataTable columns={columns} data={items} searchKeys={['full_name', 'specialty']} actions={(r) => (
          <div className="flex gap-1">
            <button type="button" className="p-1.5 text-slate-400 hover:text-[#FF9D4D]" onClick={() => { setEditing(r); setName(r.full_name); setSpecialty(r.specialty || ''); setOpen(true); }}><Edit3 className="w-4 h-4" /></button>
            <button type="button" className="p-1.5 text-slate-400 hover:text-red-400" onClick={() => setDeleting(r)}><Trash2 className="w-4 h-4" /></button>
          </div>
        )} />
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? '\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0645\u0631\u0628\u06cc' : '\u0645\u0631\u0628\u06cc \u062c\u062f\u06cc\u062f'}>
        <div className="space-y-4">
          <FormField label="\u0646\u0627\u0645" required value={name} onChange={(e) => setName(e.target.value)} />
          <FormField label="\u062a\u062e\u0635\u0635" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-300">\u0627\u0646\u0635\u0631\u0627\u0641</button>
            <button type="button" disabled={saving} onClick={save} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg disabled:opacity-50">\u0630\u062e\u06cc\u0631\u0647</button>
          </div>
        </div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} itemName={deleting?.full_name || ''} onConfirm={async () => {
        if (!gymId || !deleting) return;
        try { await coachesService.remove(gymId, deleting.id); showToast('\u062d\u0630\u0641 \u0634\u062f', 'success'); setDeleting(null); load(); }
        catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger'); }
      }} />
    </div>
  );
};
