import React from 'react';
import {
  Users,
  Wallet,
  TicketCheck,
  Activity,
  ArrowUpRight,
  Sparkles,
  Building2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  revenueChartData,
  membershipGrowthData,
  gymCapacityDistribution,
} from '../data/mockData';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { stats, activities, gyms, tickets, payments } = useApp();
  const navigate = useNavigate();

  // Custom Recharts Tooltip styled with dark surfaces & orange accents
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-[#333] p-3 rounded-xl shadow-xl text-right text-xs space-y-1">
          <p className="font-bold text-white mb-1.5 border-b border-[#2A2A2A] pb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <Header
        title="داشبورد مدیریتی فیتوپیا"
        subtitle="مرور کلی آمار، درآمد شبکه باشگاه‌ها و تیکت‌های فعال"
        quickActionLabel="ثبت باشگاه جدید"
        onQuickAction={() => navigate('/gyms')}
      />

      {/* 1. Stat Cards Grid (4 Top Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل اعضای فعال شبکه"
          value={stats.activeMembers.toLocaleString('fa-IR') + ' نفر'}
          change={stats.activeMembersChange}
          icon={Users}
          accentColor="orange"
        />
        <StatCard
          title="درآمد ماهانه کل (تومان)"
          value={(stats.monthlyRevenue / 1000000).toLocaleString('fa-IR') + ' میلیون'}
          change={stats.monthlyRevenueChange}
          icon={Wallet}
          accentColor="emerald"
        />
        <StatCard
          title="تیکت‌های باز پشتیبانی"
          value={stats.openTickets.toString()}
          change={stats.openTicketsChange}
          changePeriod="نسبت به هفته قبل"
          icon={TicketCheck}
          accentColor="purple"
        />
        <StatCard
          title="ورودهای امروز باشگاه‌ها"
          value={stats.todayCheckIns.toLocaleString('fa-IR') + ' تردد'}
          change={stats.todayCheckInsChange}
          icon={Activity}
          accentColor="blue"
        />
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#FF7A1A]" />
                روند درآمد ماهانه (میلیون تومان)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">مقایسه درآمد و هزینه‌های عملیاتی در ۶ ماه گذشته</p>
            </div>
            <span className="text-xs bg-[#FF7A1A]/10 text-[#FF7A1A] px-2.5 py-1 rounded-lg border border-[#FF7A1A]/20 font-bold">
              +۱۸.۳٪ رشد
            </span>
          </div>

          <div className="h-72 w-full dir-ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7A1A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF7A1A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="درآمد"
                  stroke="#FF7A1A"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="هزینه"
                  stroke="#64748B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Membership Growth Bar Chart */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                رشد اعضای جدید و جذب ماهانه
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">آمار ثبت‌نام ورزشکاران جدید در سراسر شعبه‌ها</p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
              ۱۳۱۰ عضو جدید
            </span>
          </div>

          <div className="h-72 w-full dir-ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={membershipGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="newMembers" name="اعضای جدید" fill="#FF7A1A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Recent Activities & Gym Capacity & Quick Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              آخرین رویدادها و فعالیت‌های سیستم
            </h3>
            <span className="text-xs text-slate-400">بروزرسانی زنده</span>
          </div>

          <div className="space-y-4">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between p-3.5 rounded-xl bg-[#141414] border border-[#242424] hover:border-[#333] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF7A1A] mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{act.action}</span>
                      <span className="text-[10px] text-slate-500 bg-[#222] px-2 py-0.5 rounded border border-[#333]">
                        {act.user}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{act.details}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gym Capacity Widget */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#FF7A1A]" />
                ظرفیت باشگاه‌های برتر
              </h3>
              <button
                onClick={() => navigate('/gyms')}
                className="text-xs text-[#FF7A1A] hover:underline flex items-center gap-1 font-semibold"
              >
                مشاهده همه
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {gymCapacityDistribution.map((gym, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{gym.name}</span>
                    <span className="text-slate-400">
                      {gym.filled} از {gym.capacity} نفر ({gym.fillPercent}٪)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#121212] rounded-full overflow-hidden border border-[#2A2A2A]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        gym.fillPercent > 90
                          ? 'bg-red-500'
                          : gym.fillPercent > 80
                          ? 'bg-[#FF7A1A]'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${gym.fillPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#262626] flex items-center justify-between text-xs">
            <span className="text-slate-400">میانگین تکمیل ظرفیت:</span>
            <span className="font-extrabold text-[#FF7A1A]">۸۳.۲٪ (عالی)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
