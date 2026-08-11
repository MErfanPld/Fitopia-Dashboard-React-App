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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'دریافت اطلاعات با خطا مواجه شد.'); }
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
      showToast('ورود ثبت شد', 'success'); setCheckInOpen(false); load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'خطا', 'danger'); }
    finally { setBusy(false); }
  };

  const doCheckOut = async (visitId: number) => {
    if (!gymId) return;
    try { await attendanceService.checkOut(gymId, visitId); showToast('خروج ثبت شد', 'success'); load(); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : 'خطا', 'danger'); }
  };

  const columns: Column<GymVisit>[] = [
    { key: 'customer_name', header: 'عضو', render: (r) => <span className="text-ink">{r.customer_name || r.guest_name || '—'}</span> },
    { key: 'check_in_at', header: 'ورود', render: (r) => <span className="text-muted text-xs">{r.check_in_at ? new Date(r.check_in_at).toLocaleString('fa-IR') : '—'}</span> },
    { key: 'check_out_at', header: 'خروج', render: (r) => <span className="text-muted text-xs">{r.check_out_at ? new Date(r.check_out_at).toLocaleString('fa-IR') : '—'}</span> },
    { key: 'is_open', header: 'وضعیت', render: (r) => r.is_open ? <span className="text-success-text text-xs">حاضر</span> : <span className="text-muted text-xs">خروج</span> },
    { key: 'method', header: 'روش', render: (r) => <span className="text-muted text-xs">{r.method || '—'}</span> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="حضور و غیاب" /><NoGymSelected /></div>;
  if (!can('attendance.view')) return <div className="space-y-6"><Header title="حضور و غیاب" /><EmptyState title="دسترسی ندارید" /></div>;

  return (
    <div className="space-y-6">
      <Header title="حضور و غیاب" subtitle="ثبت ورود و خروج" onQuickAction={can('attendance.create') ? openCheckIn : undefined} quickActionLabel={can('attendance.create') ? 'ثبت ورود' : undefined} />
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="امروز" value={stats.today_visits.toLocaleString('fa-IR')} icon={ClipboardCheck} accentColor="orange" />
          <StatCard title="حاضر الان" value={stats.currently_inside.toLocaleString('fa-IR')} icon={UserCheck} accentColor="emerald" />
          <StatCard title="این ماه" value={stats.month_visits.toLocaleString('fa-IR')} icon={LogIn} accentColor="blue" />
          <StatCard title="کل" value={stats.total_visits.toLocaleString('fa-IR')} icon={LogOut} accentColor="purple" />
        </div>
      )}
      <div className="flex justify-end"><button type="button" onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-muted"><RefreshCw className="w-4 h-4" />بروزرسانی</button></div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && visits.length === 0 && <EmptyState title="حضور ثبت‌شده‌ای نیست" />}
      {!loading && !error && visits.length > 0 && (
        <DataTable columns={columns} data={visits} searchKeys={['customer_name', 'guest_name']} actions={(r) =>
          r.is_open && can('attendance.create') ? (
            <button type="button" className="text-xs text-primary hover:underline" onClick={() => doCheckOut(r.id)}>ثبت خروج</button>
          ) : null
        } />
      )}
      <Modal isOpen={checkInOpen} onClose={() => setCheckInOpen(false)} title="ثبت ورود">
        <div className="space-y-4">
          <FormField label="عضو" isSelect required value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={[
            { value: '', label: 'انتخاب کنید' },
            ...members.map((m) => ({ value: String(m.id), label: `${m.full_name} — ${m.phone}` })),
          ]} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCheckInOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={busy || !customerId} onClick={doCheckIn} className="px-4 py-2 text-sm bg-primary text-[#0B0B0F] font-bold rounded-lg disabled:opacity-50">ثبت ورود</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
