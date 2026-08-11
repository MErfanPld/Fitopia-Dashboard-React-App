import React, { useCallback, useEffect, useState } from 'react';
import { Users, ClipboardCheck, Wallet, UserCheck, Dumbbell, BookOpen, Layers } from 'lucide-react';
import { Header } from '../components/common/Header';
import { StatCard } from '../components/common/StatCard';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../components/common/EmptyState';
import { useGymScoped } from '../hooks/useGymScoped';
import membersService from '../services/members/membersService';
import coachesService from '../services/coaches/coachesService';
import employeesService from '../services/employees/employeesService';
import attendanceService from '../services/attendance/attendanceService';
import financeService from '../services/finance/financeService';
import coursesService from '../services/courses/coursesService';
import offeringsService from '../services/offerings/offeringsService';
import type { AttendanceStats, FinanceReport } from '../types/api';

interface DashStats {
  members: number | null; coaches: number | null; employees: number | null;
  courses: number | null; offerings: number | null;
  attendance: AttendanceStats | null; finance: FinanceReport | null;
}

export const DashboardPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashStats>({
    members: null, coaches: null, employees: null, courses: null, offerings: null, attendance: null, finance: null,
  });

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    const next: DashStats = { members: null, coaches: null, employees: null, courses: null, offerings: null, attendance: null, finance: null };
    const tasks: Promise<void>[] = [];
    if (can('customer.view')) tasks.push(membersService.list(gymId).then((l) => { next.members = l.length; }).catch(() => {}));
    tasks.push(coachesService.list(gymId).then((l) => { next.coaches = l.length; }).catch(() => {}));
    if (can('employee.view')) tasks.push(employeesService.list(gymId).then((l) => { next.employees = l.length; }).catch(() => {}));
    if (can('attendance.view')) tasks.push(attendanceService.stats(gymId).then((s) => { next.attendance = s; }).catch(() => {}));
    if (can('finance.report')) tasks.push(financeService.report(gymId).then((r) => { next.finance = r; }).catch(() => {}));
    if (can('course.view')) tasks.push(coursesService.list(gymId).then((l) => { next.courses = l.length; }).catch(() => {}));
    if (can('offering.manage')) tasks.push(offeringsService.list(gymId).then((l) => { next.offerings = l.length; }).catch(() => {}));
    await Promise.all(tasks);
    setStats(next);
    setLoading(false);
  }, [gymId, can]);

  useEffect(() => {
    if (hasGym) load();
    else setLoading(false);
  }, [hasGym, load]);

  if (!hasGym) return <div className="space-y-6"><Header title="داشبورد" /><NoGymSelected /></div>;

  const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('fa-IR'));
  const money = (n: number | null | undefined) => (n == null ? '—' : `${n.toLocaleString('fa-IR')} تومان`);

  return (
    <div className="space-y-8">
      <Header title="داشبورد باشگاه" subtitle="آمار واقعی بر اساس API باشگاه" onQuickAction={load} quickActionLabel="بروزرسانی" />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {can('customer.view') && (
              <StatCard title="اعضا" value={fmt(stats.members)} icon={Users} accent="primary" />
            )}
            <StatCard title="مربیان" value={fmt(stats.coaches)} icon={Dumbbell} accent="info" />
            {can('employee.view') && (
              <StatCard title="کارکنان" value={fmt(stats.employees)} icon={UserCheck} accent="success" />
            )}
            {can('attendance.view') && (
              <StatCard title="حضور امروز" value={fmt(stats.attendance?.today_count)} icon={ClipboardCheck} accent="warning" />
            )}
            {can('course.view') && (
              <StatCard title="دوره‌ها" value={fmt(stats.courses)} icon={BookOpen} accent="info" />
            )}
            {can('offering.manage') && (
              <StatCard title="خدمات" value={fmt(stats.offerings)} icon={Layers} accent="primary" />
            )}
            {can('finance.report') && stats.finance && (
              <StatCard title="درآمد ماهانه" value={money(stats.finance.monthly?.income)} icon={Wallet} accent="success" />
            )}
          </div>
          {can('finance.report') && stats.finance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['daily', 'monthly'] as const).map((period) => (
                <div key={period} className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">{period === 'daily' ? 'مالی روزانه' : 'مالی ماهانه'}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div><p className="text-[11px] text-slate-500 mb-1">درآمد</p><p className="text-sm font-bold text-emerald-400">{money(stats.finance![period].income)}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-1">هزینه</p><p className="text-sm font-bold text-red-400">{money(stats.finance![period].expense)}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-1">خالص</p><p className="text-sm font-bold text-white">{money(stats.finance![period].net)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
