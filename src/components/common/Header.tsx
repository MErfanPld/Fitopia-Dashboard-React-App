import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Shield,
  Plus,
  CheckCircle2,
  Ticket,
  AlertCircle,
  Menu,
  Building2,
  Clock,
  XCircle,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ticketService, { GymChangeRequest } from '../../services/ticketService';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onQuickAction,
  quickActionLabel,
}) => {
  const { adminUser, activities, tickets, toggleMobileMenu, showToast } = useApp();
  const { currentGym, gymAccessList, setCurrentGym } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [changeRequests, setChangeRequests] = useState<GymChangeRequest[]>([]);
  
  // Read / Unread notification IDs tracking
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fitopia_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const navigate = useNavigate();

  const selectedGymId = currentGym?.gym || currentGym?.id || gymAccessList[0]?.gym || gymAccessList[0]?.id;

  // Save readIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fitopia_read_notifications', JSON.stringify(readIds));
    } catch (e) {
      console.warn('Failed to save read notifications:', e);
    }
  }, [readIds]);

  // Load gym change requests for notifications
  const loadChangeRequests = async () => {
    if (!selectedGymId) return;
    try {
      const list = await ticketService.getTickets(selectedGymId);
      setChangeRequests(list || []);
    } catch (err) {
      console.warn('Could not fetch change requests for notifications:', err);
    }
  };

  useEffect(() => {
    loadChangeRequests();
    const interval = setInterval(loadChangeRequests, 10000);
    return () => clearInterval(interval);
  }, [selectedGymId]);

  const openTickets = tickets.filter((t) => t.status === 'open');
  
  // Filter unread change requests and open tickets for bell badge and dropdown list
  const unreadChangeRequests = changeRequests.filter((cr) => !readIds.includes(`cr-${cr.id}`));
  const unreadOpenTickets = openTickets.filter((t) => !readIds.includes(`tkt-${t.id}`));
  const unreadCount = unreadChangeRequests.length + unreadOpenTickets.length;

  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  const handleNotificationClick = async (itemId: string, rawId: number | string) => {
    if (markingReadId) return;
    setMarkingReadId(itemId);

    try {
      if (selectedGymId) {
        await ticketService.markAsRead(selectedGymId, rawId);
      }
      // Success on server: add to readIds so it immediately vanishes from bell dropdown
      setReadIds((prev) => {
        if (!prev.includes(itemId)) {
          return [...prev, itemId];
        }
        return prev;
      });
      setShowNotifications(false);
      navigate('/tickets');
    } catch (err: any) {
      console.error('Failed to mark notification as read on server:', err);
      showToast('خطا در ثبت وضعیت خوانده‌شده روی سرور. لطفاً مجدداً تلاش کنید.', 'danger');
      // Requirement 5: Do NOT add to readIds so it remains in unread bell list
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!selectedGymId || unreadCount === 0) return;
    const unreadRawIds = [
      ...unreadChangeRequests.map((cr) => cr.id),
      ...unreadOpenTickets.map((t) => t.id),
    ];
    const unreadItemKeys = [
      ...unreadChangeRequests.map((cr) => `cr-${cr.id}`),
      ...unreadOpenTickets.map((t) => `tkt-${t.id}`),
    ];

    try {
      await ticketService.markAllAsRead(selectedGymId, unreadRawIds);
      setReadIds((prev) => Array.from(new Set([...prev, ...unreadItemKeys])));
      showToast('تمامی اعلانات به‌عنوان خوانده‌شده علامت‌گذاری شدند.', 'info');
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      showToast('خطا در به‌روزرسانی وضعیت اعلانات روی سرور.', 'danger');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/users?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#262626] px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
      {/* Top row / Left side: Mobile Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-slate-300 hover:text-white hover:border-[#3A3A3A] lg:hidden transition-colors shrink-0"
          title="منوی اصلی"
        >
          <Menu className="w-5 h-5 text-[#FF7A1A]" />
        </button>

        <div>
          {title ? (
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">{title}</h1>
              {subtitle && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[#FF7A1A] font-medium">فیتوپیا</span>
              <span>/</span>
              <span className="text-slate-200">پنل مدیریتی آمار و عملیات</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Gym Switcher & Search & Notifications & Action Button */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Active Gym Switcher */}
        {gymAccessList && gymAccessList.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-2.5 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-[#FF7A1A]" />
            {gymAccessList.length > 1 ? (
              <select
                value={currentGym?.id ?? currentGym?.gym ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const selected = gymAccessList.find(
                    (g) => String(g.id) === val || String(g.gym) === val
                  );
                  if (selected) setCurrentGym(selected);
                }}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {gymAccessList.map((g) => (
                  <option key={g.id} value={g.id} className="bg-[#1A1A1A] text-white">
                    {g.gym_name} ({g.role === 'owner' ? 'مالک' : 'پرسنل'})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-200 text-xs">
                {currentGym?.gym_name || gymAccessList[0].gym_name}
              </span>
            )}
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-40 md:w-56">
          <input
            type="text"
            placeholder="جستجو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-slate-200 placeholder-slate-500 rounded-xl pr-8 pl-3 py-1.5 text-xs focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A] transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
        </form>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) loadChangeRequests();
            }}
            className="relative p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-slate-300 hover:text-white hover:border-[#3A3A3A] transition-colors"
            title="اعلان‌ها"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF7A1A] text-slate-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute left-0 mt-2 w-84 md:w-96 bg-[#1A1A1A] border border-[#2C2C2C] rounded-2xl shadow-2xl p-4 z-50 text-right animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#FF7A1A]" />
                    اعلان‌های خوانده‌نشده
                  </span>
                  <span className="text-[11px] bg-[#FF7A1A]/10 text-[#FF7A1A] px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} مورد
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-slate-400 hover:text-[#FF7A1A] flex items-center gap-1 transition-colors cursor-pointer"
                    title="علامت‌گذاری همه اعلانات به‌عنوان خوانده‌شده"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-[#FF7A1A]" />
                    <span>خوانده شد</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5 mt-3 max-h-80 overflow-y-auto pr-1">
                {/* Unread Change Request Notifications */}
                {unreadChangeRequests.map((cr) => {
                  const itemId = `cr-${cr.id}`;
                  const isPending = cr.status === 'pending';
                  const isApproved = cr.status === 'approved';
                  const isRejected = cr.status === 'rejected';
                  const isProcessing = markingReadId === itemId;

                  return (
                    <div
                      key={itemId}
                      onClick={() => handleNotificationClick(itemId, cr.id)}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer relative ${
                        isProcessing ? 'opacity-50 pointer-events-none' : ''
                      } ${
                        isPending
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                          : isApproved
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                      }`}
                    >
                      {isPending && <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                      {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                      {isRejected && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            درخواست تغییر اطلاعات #{cr.id}
                            <span className="w-2 h-2 rounded-full bg-[#FF7A1A] inline-block shrink-0" title="خوانده نشده" />
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-300'
                                : isApproved
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {isPending ? 'در حال بررسی' : isApproved ? 'تایید شد' : 'رد شد'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          {isPending && 'درخواست تغییر اطلاعات باشگاه ثبت شده و در حال بررسی توسط پشتیبانی فیتوپیا است.'}
                          {isApproved && 'درخواست تغییر اطلاعات با موفقیت تایید و مشخصات باشگاه در سیستم به‌روز شد.'}
                          {isRejected &&
                            `درخواست تغییر اطلاعات رد شد.${cr.admin_note ? ` (توضیح: ${cr.admin_note})` : ''}`}
                        </p>
                        <span className="text-[10px] text-[#FF7A1A] underline font-semibold mt-1 block">
                          مشاهده جزییات تیکت ←
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Unread Open Tickets */}
                {unreadOpenTickets.map((t) => {
                  const itemId = `tkt-${t.id}`;
                  const isProcessing = markingReadId === itemId;

                  return (
                    <div
                      key={itemId}
                      onClick={() => handleNotificationClick(itemId, t.id)}
                      className={`bg-[#FF7A1A]/10 border border-[#FF7A1A]/30 p-2.5 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer hover:bg-[#FF7A1A]/20 ${
                        isProcessing ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 text-[#FF7A1A] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          تیکت فوری نیازمند پاسخ
                          <span className="w-2 h-2 rounded-full bg-[#FF7A1A] inline-block shrink-0" />
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">{t.subject}</p>
                        <span className="text-[11px] text-[#FF7A1A] underline mt-1 font-semibold block">
                          مشاهده تیکت‌ها ←
                        </span>
                      </div>
                    </div>
                  );
                })}

                {unreadCount === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
                    <span>هیچ اعلان جدیدی وجود ندارد.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Button (if provided) */}
        {onQuickAction && quickActionLabel && (
          <button
            onClick={onQuickAction}
            className="flex items-center gap-2 bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-[#FF7A1A]/20 hover:shadow-[#FF7A1A]/40 transition-all duration-200 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{quickActionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};
