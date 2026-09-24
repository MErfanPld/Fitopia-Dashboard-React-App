import React, { useState } from 'react';
import { KeyRound, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import tokensService, { type TokenLookupResult } from '../../services/tokens/tokensService';

function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    active: 'فعال',
    used: 'مصرف‌شده',
    expired: 'منقضی',
    revoked: 'باطل',
    pending: 'در انتظار',
  };
  if (!status) return '—';
  return map[status] || status;
}

export type TokenVerifyPanelProps = {
  gymId: number;
  /** Called after successful admit (token consumed + visit created) */
  onAdmitted?: () => void | Promise<void>;
  className?: string;
  /** Compact subtitle for attendance page */
  compact?: boolean;
};

/**
 * Gym-owner / staff token verify flow:
 * 1) lookup (no consume)  2) admit if can_admit
 */
export const TokenVerifyPanel: React.FC<TokenVerifyPanelProps> = ({
  gymId,
  onAdmitted,
  className = '',
  compact = false,
}) => {
  const { showToast } = useUI();
  const [tokenCode, setTokenCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [admitLoading, setAdmitLoading] = useState(false);
  const [lookup, setLookup] = useState<TokenLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const onTokenChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 5);
    setTokenCode(digits);
    if (lookup || lookupError) {
      setLookup(null);
      setLookupError(null);
    }
  };

  const handleLookup = async () => {
    const code = tokenCode.trim();
    if (code.length < 4) {
      showToast('کد توکن را وارد کنید', 'warning');
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setLookup(null);
    try {
      const res = await tokensService.lookup(gymId, code);
      setLookup(res);
      if (!res.valid) {
        showToast(res.message || 'توکن معتبر نیست', 'warning');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'خطا در بررسی توکن';
      setLookupError(msg);
      showToast(msg, 'danger');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAdmit = async () => {
    if (!lookup?.can_admit) return;
    const code = (lookup.token_code || tokenCode).trim();
    if (!code) return;
    setAdmitLoading(true);
    try {
      const res = await tokensService.admit(gymId, code);
      showToast(res.message || 'ورود تایید شد', 'success');
      setTokenCode('');
      setLookup(null);
      setLookupError(null);
      if (onAdmitted) await onAdmitted();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'خطا در تایید ورود';
      showToast(msg, 'danger');
    } finally {
      setAdmitLoading(false);
    }
  };

  const userName = lookup?.user?.full_name || '—';
  const userPhone = lookup?.user?.phone_number || lookup?.user?.phone || '—';

  return (
    <section
      aria-label="تایید توکن ورود"
      className={`rounded-2xl border border-border bg-surface p-4 sm:p-5 ${className}`}
      style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">تایید توکن ورود</h2>
          {!compact && (
            <p className="text-xs text-muted mt-0.5">
              کد ۵رقمی کاربر را وارد کنید، اعتبارسنجی کنید، سپس ورود را تایید کنید.
            </p>
          )}
          {compact && (
            <p className="text-xs text-muted mt-0.5">کد ۵رقمی را وارد و ورود را تایید کنید.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={5}
            value={tokenCode}
            onChange={(e) => onTokenChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleLookup();
              }
            }}
            placeholder="مثلاً ۴۸۲۹۱"
            className="w-full rounded-xl border border-border bg-input px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-ink tabular-nums
              placeholder:tracking-normal placeholder:font-medium placeholder:text-muted
              focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
            aria-label="کد توکن"
          />
        </div>
        <button
          type="button"
          disabled={lookupLoading || tokenCode.length < 4}
          onClick={() => void handleLookup()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-fg text-sm font-bold
            disabled:opacity-50 hover:opacity-95 transition-opacity shrink-0"
        >
          {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          بررسی توکن
        </button>
      </div>

      {lookupError && (
        <div className="mt-3 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger-text flex items-start gap-2">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{lookupError}</span>
        </div>
      )}

      {lookup && (
        <div
          className={`mt-3 rounded-xl border px-3.5 py-3 ${
            lookup.valid && lookup.can_admit
              ? 'border-success/30 bg-success-soft'
              : lookup.valid
                ? 'border-warning/30 bg-warning-soft'
                : 'border-danger/30 bg-danger-soft'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                {lookup.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-success-text shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger-text shrink-0" />
                )}
                <p className="text-sm font-bold text-ink truncate">
                  {lookup.message || (lookup.valid ? 'توکن معتبر است' : 'توکن نامعتبر')}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-secondary pr-6">
                <p>
                  <span className="text-muted">کاربر: </span>
                  <span className="font-semibold text-ink">{userName}</span>
                </p>
                <p>
                  <span className="text-muted">موبایل: </span>
                  <span className="font-semibold tabular-nums">{userPhone}</span>
                </p>
                <p>
                  <span className="text-muted">وضعیت: </span>
                  <span className="font-semibold">{statusLabel(lookup.status)}</span>
                </p>
              </div>
            </div>

            {lookup.can_admit && (
              <button
                type="button"
                disabled={admitLoading}
                onClick={() => void handleAdmit()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success text-white text-sm font-bold
                  disabled:opacity-50 shrink-0"
              >
                {admitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تایید ورود
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default TokenVerifyPanel;
