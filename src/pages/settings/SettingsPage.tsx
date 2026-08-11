import React, { useState } from 'react';
import { Header } from '../../components/common/Header';
import { EmptyState, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useAuth } from '../../context/AuthContext';
import { Settings, Building2, Shield, Bell } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { hasGym, currentGym } = useGymScoped();
  const { user } = useAuth();
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  if (!hasGym) return <div className="space-y-6"><Header title="تنظیمات" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="تنظیمات باشگاه" subtitle={currentGym?.gym_name || ''} />

      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Building2 className="w-5 h-5 text-[#FF7A1A]" />
          اطلاعات باشگاه
        </div>
        <div className="grid gap-3 text-sm text-slate-300">
          <div className="flex justify-between p-3 bg-[#141414] rounded-xl border border-[#262626]">
            <span className="text-slate-400">نام باشگاه</span>
            <span className="text-white font-medium">{currentGym?.gym_name || '—'}</span>
          </div>
          <div className="flex justify-between p-3 bg-[#141414] rounded-xl border border-[#262626]">
            <span className="text-slate-400">نقش شما</span>
            <span className="text-[#FF7A1A] font-medium">{currentGym?.role || '—'}</span>
          </div>
          <div className="flex justify-between p-3 bg-[#141414] rounded-xl border border-[#262626]">
            <span className="text-slate-400">کاربر</span>
            <span className="text-white font-medium">{user?.full_name || user?.username || '—'}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Shield className="w-5 h-5 text-[#FF7A1A]" />
          امنیت
        </div>
        <div className="flex items-center justify-between p-4 bg-[#141414] rounded-xl border border-[#262626]">
          <div>
            <p className="text-sm text-white font-medium">احراز هویت دومرحله‌ای</p>
            <span className="text-[11px] text-slate-400">الزامی برای ورود تمامی مدیران ارشد</span>
          </div>
          <input
            type="checkbox"
            checked={twoFactor}
            onChange={(e) => setTwoFactor(e.target.checked)}
            className="w-4 h-4 accent-[#FF7A1A] cursor-pointer"
          />
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Bell className="w-5 h-5 text-[#FF7A1A]" />
          اعلان‌ها
        </div>
        <label className="flex items-center gap-3 p-3.5 bg-[#141414] rounded-xl border border-[#242424] text-xs font-semibold text-slate-200 cursor-pointer">
          <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="accent-[#FF7A1A]" />
          اعلان ایمیل
        </label>
        <label className="flex items-center gap-3 p-3.5 bg-[#141414] rounded-xl border border-[#242424] text-xs font-semibold text-slate-200 cursor-pointer">
          <input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} className="accent-[#FF7A1A]" />
          اعلان پیامک
        </label>
      </div>
    </div>
  );
};
