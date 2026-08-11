import React, { useCallback, useEffect, useState } from 'react';
import { LogIn, LogOut, RefreshCw, ClipboardCheck, UserCheck } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import attendanceService from '../../services/attendance/attendanceService';
import membersService from '../../services/members/membersService';
import type { AttendanceStats, GymMember, GymVisit } from '../../types/api';

export const AttendancePage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('attendance.view');
  const { showToast } = useUI();
  const [visits, setVisits] = useState<GymVisit[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try {
      const [v, s] = await Promise.all([attendanceService.list(gymId), attendanceService.stats(gymId)]);
      setVisits(v); setStats(s);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym && can('attendance.view')) load(); }, [hasGym, load, can]);

  const openCheckIn = async () => {
    if (!gymId) return;
    try { setMembers(await membersService.list(gymId)); } catch { setMembers([]); }
    setCustomerId(''); setCheckInOpen(true);
  };

  const doCheckIn = async () => {
    if (!gymId || !customerId) return;
    setBusy(true);
    try {
      await attendanceService.checkIn(gymId, { customer_id: Number(customerId), method: 'manual' });
      showToast('\u0648\u0631\u0648\u062f \u062b\u0628\u062a \u0634\u062f', 'success'); setCheckInOpen(false); load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger'); }
    finally { setBusy(false); }
  };

  const doCheckOut = async (visitId: number) => {
    if (!gymId) return;
    try { await attendanceService.checkOut(gymId, visitId); showToast('\u062e\u0631\u0648\u062c \u062b\u0628\u062a \u0634\u062f', 'success'); load(); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger'); }
  };

  const columns: Column<GymVisit>[] = [
    { key: 'customer_name', header: '\u0639\u0636\u0648', render: (r) => <span className="text-white">{r.customer_name || r.guest_name || '\u2014'}</span> },
    { key: 'check_in_at', header: '\u0648\u0631\u0648\u062f', render: (r) => <span className="text-slate-300 text-xs">{r.check_in_at ? new Date(r.check_in_at).toLocaleString('fa-IR') : '\u2014'}</span> },
    { key: 'check_out_at', header: '\u062e\u0631\u0648\u062c', render: (r) => <span className="text-slate-300 text-xs">{r.check_out_at ? new Date(r.check_out_at).toLocaleString('fa-IR') : '\u2014'}</span> },
    { key: 'is_open', header: '\u0648\u0636\u0639\u06cc\u062a', render: (r) => r.is_open ? <span className="text-emerald-400 text-xs">\u062d\u0627\u0636\u0631</span> : <span className="text-slate-500 text-xs">\u062e\u0631\u0648\u062c</span> },
    { key: 'method', header: '\u0631\u0648\u0634', render: (r) => <span className="text-slate-400 text-xs">{r.method || '\u2014'}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="\u062d\u0636\u0648\u0631 \u0648 \u063a\u06cc\u0627\u0628" /><NoGymSelected /></div>;
  if (!can('attendance.view')) return <div className="space-y-6"><Header title="\u062d\u0636\u0648\u0631 \u0648 \u063a\u06cc\u0627\u0628" /><EmptyState title="\u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u062f\u0627\u0631\u06cc\u062f" /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u062d\u0636\u0648\u0631 \u0648 \u063a\u06cc\u0627\u0628" subtitle="\u0648\u0631\u0648\u062f \u0648 \u062e\u0631\u0648\u062c \u0627\u0639\u0636\u0627" onQuickAction={can('attendance.create') ? openCheckIn : undefined} quickActionLabel={can('attendance.create') ? '\u062b\u0628\u062a \u0648\u0631\u0648\u062f' : undefined} />
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="\u0627\u0645\u0631\u0648\u0632" value={stats.today_visits.toLocaleString('fa-IR')} icon={ClipboardCheck} accentColor="orange" />
          <StatCard title="\u062d\u0627\u0636\u0631 \u0627\u0644\u0627\u0646" value={stats.currently_inside.toLocaleString('fa-IR')} icon={UserCheck} accentColor="emerald" />
          <StatCard title="\u0627\u06cc\u0646 \u0645\u0627\u0647" value={stats.month_visits.toLocaleString('fa-IR')} icon={LogIn} accentColor="blue" />
          <StatCard title="\u06a9\u0644" value={stats.total_visits.toLocaleString('fa-IR')} icon={LogOut} accentColor="purple" />
        </div>
      )}
      <div className="flex justify-end"><button type="button" onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#2A2A2A] rounded-lg text-slate-300"><RefreshCw className="w-4 h-4" />\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc</button></div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && visits.length === 0 && <EmptyState title="\u062d\u0636\u0648\u0631 \u062b\u0628\u062a\u200c\u0634\u062f\u0647\u200c\u0627\u06cc \u0646\u06cc\u0633\u062a" />}
      {!loading && !error && visits.length > 0 && (
        <DataTable columns={columns} data={visits} searchKeys={['customer_name', 'guest_name']} actions={(r) =>
          r.is_open && can('attendance.create') ? (
            <button type="button" className="text-xs text-[#FF9D4D] hover:underline" onClick={() => doCheckOut(r.id)}>\u062b\u0628\u062a \u062e\u0631\u0648\u062c</button>
          ) : null
        } />
      )}
      <Modal isOpen={checkInOpen} onClose={() => setCheckInOpen(false)} title="\u062b\u0628\u062a \u0648\u0631\u0648\u062f">
        <div className="space-y-4">
          <FormField label="\u0639\u0636\u0648" isSelect required value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={[
            { value: '', label: '\u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f' },
            ...members.map((m) => ({ value: String(m.id), label: `${m.full_name} — ${m.phone}` })),
          ]} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCheckInOpen(false)} className="px-4 py-2 text-sm text-slate-300">\u0627\u0646\u0635\u0631\u0627\u0641</button>
            <button type="button" disabled={busy || !customerId} onClick={doCheckIn} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg disabled:opacity-50">\u062b\u0628\u062a \u0648\u0631\u0648\u062f</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
