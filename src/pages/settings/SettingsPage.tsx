import React, { useState } from 'react';
import { Header } from '../../components/common/Header';
import { NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useAuth } from '../../context/AuthContext';
import { useTheme, type ThemeMode } from '../../context/ThemeContext';
import { Building2, Shield, Bell, Sun, Moon, Monitor, Palette } from 'lucide-react';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'light', label: 'روشن', icon: Sun, desc: 'پس‌زمینه روشن' },
  { value: 'dark', label: 'تاریک', icon: Moon, desc: 'پس‌زمینه تیره' },
  { value: 'system', label: 'سیستم', icon: Monitor, desc: 'مطابق سیستم‌عامل' },
];

export const SettingsPage: React.FC = () => {
  const { hasGym, currentGym } = useGymScoped();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="تنظیمات" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="تنظیمات باشگاه" subtitle={currentGym?.gym_name || ''} />

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Palette className="w-5 h-5 text-primary" />
          ظاهر برنامه
        </div>
        <p className="text-xs text-muted">
          تم فعلی: {resolvedTheme === 'dark' ? 'تاریک' : 'روشن'}
          {theme === 'system' ? ' (از سیستم)' : ''}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-colors duration-200 cursor-pointer ${
                  selected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-surface-elevated hover:border-primary/40 hover:bg-surface-hover'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    selected ? 'bg-primary text-white' : 'bg-surface-hover text-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-bold ${selected ? 'text-primary' : 'text-ink'}`}>
                  {opt.label}
                </span>
                <span className="text-[11px] text-muted">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Building2 className="w-5 h-5 text-primary" />
          اطلاعات باشگاه
        </div>
        <div className="grid gap-3 text-sm text-muted">
          <div className="flex justify-between p-3 bg-surface-elevated rounded-xl border border-border">
            <span className="text-muted-2">نام باشگاه</span>
            <span className="text-ink font-medium">{currentGym?.gym_name || '—'}</span>
          </div>
          <div className="flex justify-between p-3 bg-surface-elevated rounded-xl border border-border">
            <span className="text-muted-2">نقش شما</span>
            <span className="text-primary font-medium">{currentGym?.role || '—'}</span>
          </div>
          <div className="flex justify-between p-3 bg-surface-elevated rounded-xl border border-border">
            <span className="text-muted-2">کاربر</span>
            <span className="text-ink font-medium">{user?.full_name || user?.username || '—'}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Shield className="w-5 h-5 text-primary" />
          امنیت
        </div>
        <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border">
          <div>
            <p className="text-sm text-ink font-medium">احراز هویت دومرحله‌ای</p>
            <span className="text-[11px] text-muted-2">الزامی برای ورود تمامی مدیران ارشد</span>
          </div>
          <input
            type="checkbox"
            checked={twoFactor}
            onChange={(e) => setTwoFactor(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Bell className="w-5 h-5 text-primary" />
          اعلان‌ها
        </div>
        <label className="flex items-center gap-3 p-3.5 bg-surface-elevated rounded-xl border border-border text-xs font-semibold text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={emailNotif}
            onChange={(e) => setEmailNotif(e.target.checked)}
            className="accent-primary"
          />
          اعلان ایمیل
        </label>
        <label className="flex items-center gap-3 p-3.5 bg-surface-elevated rounded-xl border border-border text-xs font-semibold text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={smsNotif}
            onChange={(e) => setSmsNotif(e.target.checked)}
            className="accent-primary"
          />
          اعلان پیامک
        </label>
      </div>
    </div>
  );
};
