import React, { useState } from 'react';
import { Building2, Shield, Sun, Moon } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { FormField } from '../../components/common/FormField';
import { NoGymSelected } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import gymService from '../../services/gyms/gymService';
import { ROLE_LABELS, type StaffRole, type GymUpdatePayload } from '../../types/api';

export const SettingsPage: React.FC = () => {
  const { user, currentGym, gymId } = useAuth();
  const { showToast } = useUI();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [form, setForm] = useState<GymUpdatePayload>({
    description: '', phone: '', whatsapp: '', telegram: '', instagram: '', website: '', rules: '', working_hours: '',
  });
  const [saving, setSaving] = useState(false);

  const roleLabel =
    currentGym?.role && ROLE_LABELS[currentGym.role as StaffRole]
      ? ROLE_LABELS[currentGym.role as StaffRole]
      : currentGym?.role
        ? String(currentGym.role)
        : '—';

  const saveGym = async () => {
    if (!gymId) return;
    setSaving(true);
    try {
      await gymService.update(gymId, form);
      showToast('اطلاعات باشگاه به‌روزرسانی شد.', 'success');
    } catch (e: unknown) {
      showToast(
        e instanceof Error
          ? e.message
          : 'خطا در ذخیره. برای تغییر نام یا آدرس از بخش تیکت‌ها درخواست ثبت کنید.',
        'danger',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!gymId) {
    return (
      <div className="space-y-4">
        <Header title="تنظیمات" subtitle="اطلاعات باشگاه و حساب کاربری" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="تنظیمات" subtitle="اطلاعات باشگاه، حساب کاربری و ظاهر پنل" />

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Shield className="w-4 h-4 text-primary" />
          حساب کاربری
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <p className="text-[11px] text-muted">نام کاربری</p>
            <p className="font-medium text-ink mt-0.5">{user?.full_name || user?.username || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <p className="text-[11px] text-muted">شماره تماس</p>
            <p className="font-medium text-ink mt-0.5 tabular-nums">{user?.phone || user?.phone_number || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <p className="text-[11px] text-muted">باشگاه فعال</p>
            <p className="font-medium text-ink mt-0.5">{currentGym?.gym_name || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <p className="text-[11px] text-muted">نقش شما</p>
            <p className="font-medium text-primary mt-0.5">{roleLabel}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-ink font-semibold">
          {resolvedTheme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
          ظاهر پنل
        </div>
        <div className="flex flex-wrap gap-2">
          {([{ value: 'light', label: 'روشن' }, { value: 'dark', label: 'تاریک' }, { value: 'system', label: 'سیستم' }] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                theme === opt.value
                  ? 'bg-primary-soft border-primary text-primary font-semibold'
                  : 'border-border text-muted hover:bg-surface-hover'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button type="button" onClick={toggleTheme} className="px-4 py-2 rounded-xl text-sm border border-border text-muted hover:bg-surface-hover">
            تعویض سریع
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Building2 className="w-4 h-4 text-primary" />
          اطلاعات قابل ویرایش باشگاه
        </div>
        <p className="text-[11px] text-muted">
          برای تغییر نام یا آدرس باشگاه از بخش «تیکت‌ها» درخواست ویرایش ثبت کنید.
        </p>
        <FormField label="توضیحات" isTextarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="تلفن" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <FormField label="واتساپ" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <FormField label="تلگرام" value={form.telegram || ''} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
          <FormField label="اینستاگرام" value={form.instagram || ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          <FormField label="وب‌سایت" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <FormField label="ساعات کاری" value={form.working_hours || ''} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} />
        </div>
        <FormField label="قوانین باشگاه" isTextarea value={form.rules || ''} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
        <div className="flex justify-end">
          <button type="button" disabled={saving} onClick={saveGym} className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold disabled:opacity-50">
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
