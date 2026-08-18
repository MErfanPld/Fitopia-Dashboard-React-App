import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Ticket, BookOpen, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ticketsService from '../../services/tickets/ticketsService';
import coursesService from '../../services/courses/coursesService';
import type { GymChangeRequest, Course } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

type NotifItem = {
  id: string;
  kind: 'ticket' | 'course';
  title: string;
  subtitle?: string;
  href: string;
  created_at?: string;
};

const PENDING_TICKET = new Set(['pending', 'open', 'waiting', 'in_review', 'submitted', 'new']);

function isPendingTicket(t: GymChangeRequest): boolean {
  const s = String(t.status || '').toLowerCase();
  if (!s) return true;
  if (['resolved', 'closed', 'rejected', 'approved', 'done', 'cancelled'].includes(s)) return false;
  return PENDING_TICKET.has(s) || s.includes('pend') || s.includes('wait');
}

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار',
  open: 'باز',
  waiting: 'در انتظار',
  in_review: 'در حال بررسی',
  submitted: 'ارسال‌شده',
  draft: 'پیش‌نویس',
  full: 'تکمیل ظرفیت',
};

export const NotificationBell: React.FC = () => {
  const { gymId, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!gymId || !isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const [tickets, courses] = await Promise.all([
        ticketsService.list(gymId).catch(() => [] as GymChangeRequest[]),
        coursesService.list(gymId).catch(() => [] as Course[]),
      ]);

      const notifs: NotifItem[] = [];

      for (const t of tickets || []) {
        if (!isPendingTicket(t)) continue;
        const typeLabel =
          t.request_type === 'new_sport'
            ? 'پیشنهاد رشته'
            : t.request_type === 'field_edit'
              ? 'درخواست ویرایش'
              : t.request_type || 'تیکت';
        notifs.push({
          id: `ticket-${t.id}`,
          kind: 'ticket',
          title: typeLabel,
          subtitle: STATUS_FA[String(t.status).toLowerCase()] || String(t.status || 'در انتظار'),
          href: '/tickets',
          created_at: t.created_at,
        });
      }

      for (const c of courses || []) {
        if (c.status === 'draft') {
          notifs.push({
            id: `course-draft-${c.id}`,
            kind: 'course',
            title: c.title || 'دوره',
            subtitle: 'پیش‌نویس — منتظر انتشار',
            href: '/courses',
            created_at: c.created_at || c.updated_at,
          });
        } else if (c.status === 'full') {
          notifs.push({
            id: `course-full-${c.id}`,
            kind: 'course',
            title: c.title || 'دوره',
            subtitle: 'ظرفیت تکمیل شده',
            href: '/courses',
            created_at: c.updated_at || c.created_at,
          });
        }
      }

      notifs.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      setItems(notifs.slice(0, 20));
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, [gymId, isAuthenticated]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const count = items.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        className="relative p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-hover transition-colors"
        aria-label="اعلان‌ها"
        title="اعلان‌ها"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 left-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-fg text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '۹+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface shadow-xl z-[100] overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-header">
            <p className="text-sm font-bold text-ink">اعلان‌ها</p>
            {loading && <span className="text-[11px] text-muted">بروزرسانی...</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 opacity-40" />
                اعلان جدیدی نیست
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="w-full text-right px-4 py-3 hover:bg-surface-hover border-b border-border last:border-0 flex gap-3 items-start"
                  onClick={() => {
                    setOpen(false);
                    navigate(n.href);
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                    {n.kind === 'ticket' ? (
                      <Ticket className="w-4 h-4 text-primary" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{n.title}</p>
                    {n.subtitle && <p className="text-[11px] text-muted mt-0.5">{n.subtitle}</p>}
                    {n.created_at && (
                      <p className="text-[10px] text-muted mt-1 tabular-nums">{formatJalaliDateTime(n.created_at)}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-border bg-header/50 flex gap-2">
            <button
              type="button"
              className="flex-1 text-xs py-2 rounded-lg text-primary hover:bg-primary-soft font-medium"
              onClick={() => {
                setOpen(false);
                navigate('/tickets');
              }}
            >
              تیکت‌ها
            </button>
            <button
              type="button"
              className="flex-1 text-xs py-2 rounded-lg text-muted hover:bg-surface-hover"
              onClick={() => {
                setOpen(false);
                navigate('/courses');
              }}
            >
              دوره‌ها
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
