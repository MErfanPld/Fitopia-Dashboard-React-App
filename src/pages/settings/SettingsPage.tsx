import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Shield, RefreshCw } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { FormField } from '../../components/common/FormField';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import gymService from '../../services/gyms/gymService';
import type { GymChangeRequest, GymUpdatePayload } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

export const SettingsPage: React.FC = () => {
  const { user, currentGym, gymId } = useAuth();
  const { showToast } = useUI();
  const theme = useTheme();
  const [form, setForm] = useState<GymUpdatePayload>({
    description: '', phone: '', whatsapp: '', telegram: '', instagram: '', website: '', rules: '', working_hours: '',
  });
  const [saving, setSaving] = useState(false);
  const [changeRequests, setChangeRequests] = useState<GymChangeRequest[]>([]);
  const [crLoading, setCrLoading] = useState(false);
  const [crError, setCrError] = useState<string | null>(null);
  const [crNote, setCrNote] = useState('');
  const [crType, setCrType] = useState('general');

  const loadChangeRequests = useCallback(async () => {
    if (!gymId) return;
    setCrLoading(true);
    setCrError(null);
    try {
      setChangeRequests(await gymService.listChangeRequests(gymId));
    } catch (e: unknown) {
      setCrError(e instanceof Error ? e.message : 'خطا در دریافت درخواست‌ها');
    } finally {
      setCrLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (gymId) loadChangeRequests();
  }, [gymId, loadChangeRequests]);

  const saveGym = async () => {
    if (!gymId) return;
    setSaving(true);
    try {
      await gymService.update(gymId, form);
      showToast('اطلاعات باشگاه به‌روزرسانی شد.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ذخیره. برای فیلدهای محدود از درخواست تغییر استفاده کنید.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const submitChangeRequest = async () => {
    if (!gymId || !crNote.trim()) {
      showToast('توضیح درخواست الزامی است.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await gymService.createChangeRequest(gymId, {
        request_type: crType,
        payload: { note: crNote.trim() },
      });
      showToast('درخواست تغییر ثبت شد.', 'success');
      setCrNote('');
      loadChangeRequests();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ثبت درخواست', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (!gymId) {
    return (
      <div className="space-y-6">
        <Header title="تنظیمات باشگاه" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="تنظیمات باشگاه" subtitle={currentGym?.gym_name || ''} />

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Building2 className="w-5 h-5 text-primary" />
          اطلاعات باشگاه
        </div>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between p-3 bg-surface-elevated rounded-xl border border-border">
            <span className="text-muted">نام باشگاه</span>
            <span className="text-ink font-medium">{currentGym?.gym_name || '—'}</span>
          </div>
          <div className="flex justify-between p-3 bg-surface-elevated rounded-xl border border-border">
            <span className="text-muted">نقش شما</span>
            <span className="text-primary font-medium">{currentGym?.role || '—'}</span>
          </div>
          <div className="flex justify-between p-3 bg-surface-elevated rounded-xl border border-border">
            <span className="text-muted">کاربر</span>
            <span className="text-ink font-medium">{user?.full_name || user?.username || '—'}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h3 className="text-ink font-semibold">ویرایش مستقیم (فیلدهای مجاز API)</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <FormField label="تلفن" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <FormField label="واتساپ" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <FormField label="تلگرام" value={form.telegram || ''} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
          <FormField label="اینستاگرام" value={form.instagram || ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          <FormField label="وب‌سایت" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <FormField label="ساعات کاری" value={form.working_hours || ''} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} />
        </div>
        <FormField label="توضیحات" isTextarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <FormField label="قوانین" isTextarea value={form.rules || ''} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
        <button type="button" disabled={saving} onClick={saveGym} className="px-4 py-2 rounded-xl bg-primary text-primary-fg text-sm font-bold disabled:opacity-50">
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات مجاز'}
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-ink font-semibold">درخواست‌های تغییر (Change Requests)</h3>
          <button type="button" onClick={loadChangeRequests} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
            <RefreshCw className="w-3.5 h-3.5" /> به‌روزرسانی
          </button>
        </div>
        <FormField label="نوع درخواست" value={crType} onChange={(e) => setCrType(e.target.value)} />
        <FormField label="توضیح درخواست" isTextarea value={crNote} onChange={(e) => setCrNote(e.target.value)} />
        <button type="button" disabled={saving} onClick={submitChangeRequest} className="px-4 py-2 rounded-xl border border-border text-sm text-ink hover:bg-surface-hover disabled:opacity-50">
          ثبت درخواست تغییر
        </button>
        {crLoading && <LoadingBlock />}
        {crError && <ErrorBlock message={crError} onRetry={loadChangeRequests} />}
        {!crLoading && !crError && changeRequests.length === 0 && (
          <EmptyState title="درخواستی ثبت نشده است" />
        )}
        {!crLoading && changeRequests.length > 0 && (
          <ul className="space-y-2">
            {changeRequests.map((r) => (
              <li key={r.id} className="p-3 rounded-xl border border-border bg-surface-elevated text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-ink font-medium">{r.request_type || '—'}</span>
                  <span className="text-muted text-xs">{r.status}</span>
                </div>
                <p className="text-muted text-xs mt-1">{formatJalaliDateTime(r.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Shield className="w-5 h-5 text-primary" />
          ظاهر
        </div>
        <p className="text-sm text-muted">تم اصلی محصول Dark + Orange است. در صورت پشتیبانی، حالت سیستم نیز قابل انتخاب است.</p>
        <div className="flex gap-2">
          {(['dark', 'light', 'system'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => theme.setTheme?.(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs border ${theme.theme === mode ? 'border-primary text-primary' : 'border-border text-muted'}`}
            >
              {mode === 'dark' ? 'تاریک' : mode === 'light' ? 'روشن' : 'سیستم'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
