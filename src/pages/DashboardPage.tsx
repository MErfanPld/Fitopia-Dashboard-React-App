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

  if (!hasGym) return <div className="space-y-6"><Header title="\u062f\u0627\u0634\u0628\u0648\u0631\u062f" /><NoGymSelected /></div>;

  const fmt = (n: number | null | undefined) => (n == null ? '\u2014' : n.toLocaleString('fa-IR'));
  const money = (n: number | null | undefined) => (n == null ? '\u2014' : `${n.toLocaleString('fa-IR')} \u062a\u0648\u0645\u0627\u0646`);

  return (
    <div className="space-y-8">
      <Header title="\u062f\u0627\u0634\u0628\u0648\u0631\u062f \u0628\u0627\u0634\u06af\u0627\u0647" subtitle="\u0622\u0645\u0627\u0631 \u0648\u0627\u0642\u0639\u06cc \u0628\u0631 \u0627\u0633\u0627\u0633 API \u0628\u0627\u0634\u06af\u0627\u0647" onQuickAction={load} quickActionLabel="\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc" />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="\u0627\u0639\u0636\u0627" value={fmt(stats.members)} icon={Users} accentColor="orange" />
            <StatCard title="\u062d\u0636\u0648\u0631 \u0627\u0645\u0631\u0648\u0632" value={fmt(stats.attendance?.today_visits)} icon={ClipboardCheck} accentColor="blue" />
            <StatCard title="\u062d\u0627\u0636\u0631 \u062f\u0631 \u0628\u0627\u0634\u06af\u0627\u0647" value={fmt(stats.attendance?.currently_inside)} icon={UserCheck} accentColor="emerald" />
            <StatCard title="\u062f\u0631\u0622\u0645\u062f \u0645\u0627\u0647" value={stats.finance ? money(stats.finance.monthly.income) : '\u2014'} icon={Wallet} accentColor="purple" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="\u0645\u0631\u0628\u06cc\u0627\u0646" value={fmt(stats.coaches)} icon={Dumbbell} accentColor="orange" />
            <StatCard title="\u06a9\u0627\u0631\u06a9\u0646\u0627\u0646" value={fmt(stats.employees)} icon={Users} accentColor="blue" />
            <StatCard title="\u062f\u0648\u0631\u0647\u200c\u0647\u0627" value={fmt(stats.courses)} icon={BookOpen} accentColor="emerald" />
            <StatCard title="\u062e\u062f\u0645\u0627\u062a" value={fmt(stats.offerings)} icon={Layers} accentColor="purple" />
          </div>
          {stats.finance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(['daily', 'monthly'] as const).map((period) => (
                <div key={period} className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">{period === 'daily' ? '\u062e\u0644\u0627\u0635\u0647 \u0645\u0627\u0644\u06cc \u0627\u0645\u0631\u0648\u0632' : '\u062e\u0644\u0627\u0635\u0647 \u0645\u0627\u0644\u06cc \u0645\u0627\u0647'}</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-[11px] text-slate-500 mb-1">\u062f\u0631\u0622\u0645\u062f</p><p className="text-sm font-bold text-emerald-400">{money(stats.finance![period].income)}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-1">\u0647\u0632\u06cc\u0646\u0647</p><p className="text-sm font-bold text-red-400">{money(stats.finance![period].expense)}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-1">\u062e\u0627\u0644\u0635</p><p className="text-sm font-bold text-white">{money(stats.finance![period].net)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!stats.finance && !can('finance.report') && (
            <EmptyState title="\u06af\u0632\u0627\u0631\u0634 \u0645\u0627\u0644\u06cc \u062f\u0631 \u062f\u0633\u062a\u0631\u0633 \u0646\u06cc\u0633\u062a" description="\u0628\u0631\u0627\u06cc \u0645\u0634\u0627\u0647\u062f\u0647 \u0622\u0645\u0627\u0631 \u0645\u0627\u0644\u06cc \u0628\u0647 \u0645\u062c\u0648\u0632 \u00ab\u06af\u0632\u0627\u0631\u0634 \u0645\u0627\u0644\u06cc\u00bb \u0646\u06cc\u0627\u0632 \u062f\u0627\u0631\u06cc\u062f." />
          )}
        </>
      )}
    </div>
  );
};
