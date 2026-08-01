import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import ticketService, { GymChangeRequest, GymTicketMessage } from '../services/ticketService';
import gymService from '../services/gymService';
import { parseApiErrorMessage } from '../utils/errorUtils';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  XCircle,
  FileText,
  ShieldAlert,
} from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const { currentGym, gymAccessList } = useAuth();
  const selectedGymId = currentGym?.gym || currentGym?.id || gymAccessList[0]?.gym || gymAccessList[0]?.id;

  const [tickets, setTickets] = useState<GymChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [viewingTicket, setViewingTicket] = useState<GymChangeRequest | null>(null);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Reply text state
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Create new ticket (change request) state
  const [newRequestData, setNewRequestData] = useState({
    requestType: 'new_sport' as 'new_sport' | 'field_edit',
    sportName: '',
    note: '',
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Fetch Tickets List
  const fetchTickets = async () => {
    if (!selectedGymId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getTickets(selectedGymId);
      setTickets(data || []);
    } catch (err: any) {
      console.error('Failed to fetch tickets:', err);
      setError('خطا در دریافت لیست درخواست‌ها و تیکت‌ها.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGymId) {
      fetchTickets();
    }
  }, [selectedGymId]);

  // Open Ticket Detail and fetch messages
  const handleOpenTicket = async (ticket: GymChangeRequest) => {
    setViewingTicket(ticket);
    setLoadingTicketDetail(true);
    setReplyText('');
    try {
      if (selectedGymId) {
        const detail = await ticketService.getTicketDetail(selectedGymId, ticket.id);
        setViewingTicket(detail);
      }
    } catch (err: any) {
      console.error('Failed to fetch ticket detail:', err);
      // Keep existing object if detail fetch fails
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  // Submit Reply
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !viewingTicket || !selectedGymId) return;

    setIsSendingReply(true);
    try {
      const newMessage = await ticketService.sendMessage(selectedGymId, viewingTicket.id, replyText.trim());
      setReplyText('');

      // Update viewing ticket messages immediately
      setViewingTicket({
        ...viewingTicket,
        messages: [...(viewingTicket.messages || []), newMessage],
      });
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      alert(parseApiErrorMessage(err, 'خطا در ارسال پاسخ.'));
    } finally {
      setIsSendingReply(false);
    }
  };

  // Submit New Change Request / Ticket
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGymId) return;

    setIsSubmittingRequest(true);
    try {
      const payload: Record<string, any> = {};
      if (newRequestData.requestType === 'new_sport') {
        payload.sport_name = newRequestData.sportName;
        payload.note = newRequestData.note;
      } else {
        payload.note = newRequestData.note;
      }

      await gymService.requestChange(selectedGymId, payload);
      setIsCreateOpen(false);
      setNewRequestData({ requestType: 'new_sport', sportName: '', note: '' });
      fetchTickets();
      alert('درخواست جدید با موفقیت ثبت شد.');
    } catch (err: any) {
      console.error('Failed to submit request:', err);
      alert(parseApiErrorMessage(err, 'خطا در ثبت درخواست.'));
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (typeFilter !== 'all' && t.request_type !== typeFilter) return false;
    return true;
  });

  // Helper function for request_type label
  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'field_edit':
        return 'ویرایش اطلاعات باشگاه';
      case 'new_sport':
        return 'پیشنهاد رشته ورزشی جدید';
      default:
        return type || 'درخواست پشتیبانی';
    }
  };

  // Helper badge for status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            در انتظار بررسی
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تایید شده
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            رد شده
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const columns: Column<GymChangeRequest>[] = [
    {
      key: 'id',
      header: 'کد درخواست',
      sortable: true,
      render: (t) => <span className="font-mono font-bold text-[#FF7A1A]">#CR-{t.id}</span>,
    },
    {
      key: 'request_type',
      header: 'نوع درخواست / موضوع',
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-bold text-white block text-sm">{getRequestTypeLabel(t.request_type)}</span>
          {t.admin_note && (
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate max-w-xs">
              پاسخ مدیر: {t.admin_note}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'وضعیت بررسی',
      sortable: true,
      render: (t) => renderStatusBadge(t.status),
    },
    {
      key: 'created_at',
      header: 'تاریخ ثبت',
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs text-slate-400">
          {t.created_at ? new Date(t.created_at).toLocaleDateString('fa-IR') : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="درخواست‌ها و تیکت‌های پشتیبانی"
        subtitle="پیگیری درخواست‌های تغییر اطلاعات، پیشنهاد رشته‌های ورزشی و گفتگو با مرکز پشتیبانی"
        quickActionLabel="ثبت درخواست جدید"
        onQuickAction={() => setIsCreateOpen(true)}
      />

      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#FF7A1A] animate-spin" />
          <span className="text-xs">در حال دریافت تیکت‌ها...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchTickets}
            className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg font-bold"
          >
            تلاش مجدد
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#141414] border border-[#262626] rounded-2xl space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">هنوز تیکتی ثبت نشده است</p>
          <p className="text-xs text-slate-500">
            برای ثبت اولین درخواست یا پیشنهاد، از دکمه «ثبت درخواست جدید» استفاده کنید.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredTickets}
          searchPlaceholder="جستجوی موضوع یا کد تیکت..."
          searchKeys={['id', 'request_type', 'admin_note']}
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A]"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار بررسی</option>
                <option value="approved">تایید شده</option>
                <option value="rejected">رد شده</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A]"
              >
                <option value="all">همه موضوعات</option>
                <option value="field_edit">ویرایش اطلاعات باشگاه</option>
                <option value="new_sport">پیشنهاد رشته ورزشی</option>
              </select>
            </div>
          }
          actions={(t) => (
            <button
              onClick={() => handleOpenTicket(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#FF7A1A] hover:text-slate-950 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>مشاهده گفتگو ({t.messages ? t.messages.length : 0})</span>
            </button>
          )}
        />
      )}

      {/* TICKET CONVERSATION MODAL */}
      {viewingTicket && (
        <Modal
          isOpen={!!viewingTicket}
          onClose={() => setViewingTicket(null)}
          title={`درخواست #CR-${viewingTicket.id}: ${getRequestTypeLabel(viewingTicket.request_type)}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Status & Info Bar */}
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {renderStatusBadge(viewingTicket.status)}
                <span className="text-slate-400 font-mono">
                  تاریخ ثبت:{' '}
                  {viewingTicket.created_at ? new Date(viewingTicket.created_at).toLocaleDateString('fa-IR') : '-'}
                </span>
              </div>

              {viewingTicket.admin_note && (
                <div className="p-2 bg-[#222] border border-[#333] rounded-xl text-slate-300 text-[11px]">
                  <strong className="text-[#FF7A1A]">یادداشت پشتیبانی: </strong>
                  {viewingTicket.admin_note}
                </div>
              )}
            </div>

            {/* Conversation Messages Thread */}
            <div className="space-y-4 max-h-80 overflow-y-auto p-3 bg-[#121212] rounded-2xl border border-[#242424]">
              {loadingTicketDetail ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#FF7A1A] animate-spin" />
                  <span>در حال دریافت پیام‌ها...</span>
                </div>
              ) : !viewingTicket.messages || viewingTicket.messages.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  هنوز پیامی در این گفتگو ثبت نشده است.
                </div>
              ) : (
                viewingTicket.messages.map((msg) => {
                  const isGym = msg.sender_role === 'gym';
                  const isAdmin = msg.sender_role === 'admin';
                  const isSystem = msg.sender_role === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="p-2.5 bg-[#1F1F1F] border border-[#2F2F2F] rounded-xl text-center text-[11px] text-slate-400 mx-auto max-w-md">
                        ⚙️ {msg.message}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 text-xs ${
                        isGym ? 'flex-row text-right' : 'flex-row-reverse text-left'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-slate-300 font-bold text-[10px] shrink-0">
                        {isGym ? 'شما' : 'ادمین'}
                      </div>

                      <div
                        className={`max-w-md p-3.5 rounded-2xl ${
                          isGym
                            ? 'bg-[#FF7A1A]/10 border border-[#FF7A1A]/30 text-white rounded-tr-none'
                            : 'bg-[#1C1C1C] border border-[#2C2C2C] text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-[#ffffff10]">
                          <span className="font-extrabold text-white">
                            {isGym ? 'مدیر باشگاه' : 'پشتیبانی فیتوپیا'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleReplySubmit} className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-300 text-right">ارسال پیام جدید</label>
              <textarea
                rows={3}
                placeholder="متن پیام خود را بنویسید..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-[#141414] border border-[#2A2A2A] text-slate-100 placeholder-slate-500 rounded-xl p-3 text-xs focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A]"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  پیام شما مستقیما برای تیم پشتیبانی ارسال می‌شود.
                </span>
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSendingReply}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4 rotate-180" />
                  <span>{isSendingReply ? 'در حال ارسال...' : 'ارسال پیام'}</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* CREATE NEW CHANGE REQUEST MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="ثبت درخواست جدید">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <FormField
            label="نوع درخواست"
            isSelect
            value={newRequestData.requestType}
            onChange={(e) =>
              setNewRequestData({
                ...newRequestData,
                requestType: e.target.value as 'new_sport' | 'field_edit',
              })
            }
            options={[
              { value: 'new_sport', label: 'پیشنهاد افزودن رشته ورزشی جدید' },
              { value: 'field_edit', label: 'ویرایش مشخصات اصلی باشگاه' },
            ]}
          />

          {newRequestData.requestType === 'new_sport' && (
            <FormField
              label="عنوان رشته ورزشی پیشنهادی"
              required
              placeholder="مثلا: پادلبدنسازی، یوگا هوایی، کراس‌فیت بانوان..."
              value={newRequestData.sportName}
              onChange={(e) => setNewRequestData({ ...newRequestData, sportName: e.target.value })}
            />
          )}

          <FormField
            label="شرح کامل درخواست"
            required
            isTextArea
            rows={4}
            placeholder="توضیحات کامل جهت بررسی مدیریت فیتوپیا..."
            value={newRequestData.note}
            onChange={(e) => setNewRequestData({ ...newRequestData, note: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-[#333] text-slate-300 hover:bg-[#222] text-xs font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmittingRequest}
              className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20 disabled:opacity-50"
            >
              {isSubmittingRequest ? 'در حال ثبت...' : 'ثبت درخواست'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
