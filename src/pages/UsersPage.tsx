import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { FormField } from '../components/common/FormField';
import customerService, { GymCustomer, GymCustomerInput } from '../services/customerService';
import gymService, { Sport } from '../services/gymService';
import { parseApiErrorMessage } from '../utils/errorUtils';
import {
  UserPlus,
  Eye,
  Edit3,
  Trash2,
  Phone,
  Calendar,
  RefreshCw,
  UserCheck,
  Dumbbell,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { currentGym, gymAccessList } = useAuth();
  const selectedGymId = currentGym?.gym || currentGym?.id || gymAccessList[0]?.gym || gymAccessList[0]?.id || 1;

  // Customers state
  const [customers, setCustomers] = useState<GymCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Sports list state
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [loadingSports, setLoadingSports] = useState(false);

  // Filter state
  const [sportFilter, setSportFilter] = useState<string>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<GymCustomer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<GymCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<GymCustomer | null>(null);
  
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    full_name: string;
    phone: string;
    sport: number | null;
    join_date: string;
  }>({
    full_name: '',
    phone: '',
    sport: null,
    join_date: new Date().toISOString().split('T')[0],
  });

  const fetchCustomers = async () => {
    if (!selectedGymId) return;
    setLoadingCustomers(true);
    setCustomerError(null);
    try {
      const list = await customerService.getCustomers(selectedGymId);
      setCustomers(list || []);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setCustomerError(parseApiErrorMessage(err, 'خطا در دریافت لیست مشتریان.'));
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchSports = async () => {
    setLoadingSports(true);
    try {
      const sportsList = await gymService.getSports();
      setAllSports(sportsList || []);
    } catch (err) {
      console.warn('Could not fetch sports for customers page:', err);
    } finally {
      setLoadingSports(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchSports();
  }, [selectedGymId]);

  const openCreateModal = () => {
    setFormData({
      full_name: '',
      phone: '',
      sport: null,
      join_date: new Date().toISOString().split('T')[0],
    });
    setModalError(null);
    if (allSports.length === 0) fetchSports();
    setIsCreateOpen(true);
  };

  const openEditModal = async (c: GymCustomer) => {
    setEditingCustomer(c);
    setFormData({
      full_name: c.full_name || '',
      phone: c.phone || '',
      sport: c.sport ?? null,
      join_date: c.join_date || new Date().toISOString().split('T')[0],
    });
    setModalError(null);
    if (allSports.length === 0) fetchSports();

    // Fetch fresh customer details from server
    if (selectedGymId && c.id) {
      setLoadingCustomerDetail(true);
      try {
        const fresh = await customerService.getCustomer(selectedGymId, c.id);
        if (fresh) {
          setEditingCustomer(fresh);
          setFormData({
            full_name: fresh.full_name || '',
            phone: fresh.phone || '',
            sport: fresh.sport ?? null,
            join_date: fresh.join_date || new Date().toISOString().split('T')[0],
          });
        }
      } catch (err) {
        console.warn('Could not fetch fresh customer detail from server:', err);
      } finally {
        setLoadingCustomerDetail(false);
      }
    }
  };

  const handleViewDetail = async (c: GymCustomer) => {
    setViewingCustomer(c);
    if (selectedGymId && c.id) {
      setLoadingCustomerDetail(true);
      try {
        const detail = await customerService.getCustomer(selectedGymId, c.id);
        if (detail) {
          setViewingCustomer(detail);
        }
      } catch (e) {
        console.warn('Could not fetch fresh detail for viewing customer:', e);
      } finally {
        setLoadingCustomerDetail(false);
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setModalError('لطفاً نام و نام خانوادگی مشتری را وارد کنید.');
      return;
    }
    if (!formData.phone.trim()) {
      setModalError('لطفاً شماره تماس مشتری را وارد کنید.');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const newCustomer = await customerService.createCustomer(selectedGymId, {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        sport: formData.sport,
        join_date: formData.join_date || undefined,
      });

      setCustomers((prev) => [newCustomer, ...prev]);
      setIsCreateOpen(false);
      fetchCustomers();
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      setModalError(parseApiErrorMessage(err, 'خطا در ثبت مشتری جدید.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (!formData.full_name.trim()) {
      setModalError('لطفاً نام و نام خانوادگی مشتری را وارد کنید.');
      return;
    }
    if (!formData.phone.trim()) {
      setModalError('لطفاً شماره تماس مشتری را وارد کنید.');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    const patchData: Partial<GymCustomerInput> = {};
    if (formData.full_name.trim() !== (editingCustomer.full_name || '')) {
      patchData.full_name = formData.full_name.trim();
    }
    if (formData.phone.trim() !== (editingCustomer.phone || '')) {
      patchData.phone = formData.phone.trim();
    }
    if (formData.sport !== editingCustomer.sport) {
      patchData.sport = formData.sport;
    }
    if (formData.join_date !== (editingCustomer.join_date || '')) {
      patchData.join_date = formData.join_date;
    }

    try {
      const updated = await customerService.patchCustomer(selectedGymId, editingCustomer.id, patchData);
      setCustomers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      setModalError(parseApiErrorMessage(err, 'خطا در بروزرسانی اطلاعات مشتری.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(selectedGymId, deletingCustomer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      alert(parseApiErrorMessage(err, 'خطا در حذف مشتری.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered dataset
  const filteredCustomers = customers.filter((c) => {
    if (sportFilter !== 'all') {
      const filterSportId = parseInt(sportFilter, 10);
      if (c.sport !== filterSportId) return false;
    }
    return true;
  });

  // Helper function to resolve sport name
  const getSportName = (c: GymCustomer): string => {
    if (c.sport_name) return c.sport_name;
    if (c.sport) {
      const found = allSports.find((s) => s.id === c.sport);
      if (found) return found.name;
      return `کد ${c.sport}`;
    }
    return 'مشخص نشده';
  };

  // Data Table Columns
  const columns: Column<GymCustomer>[] = [
    {
      key: 'full_name',
      header: 'نام و مشخصات مشتری',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#222] border border-[#333] overflow-hidden flex items-center justify-center text-[#FF7A1A] shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white block text-sm">{c.full_name}</span>
            <span className="text-[11px] text-slate-400 font-mono">شناسه: #{c.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'شماره همراه',
      sortable: true,
      render: (c) => (
        <span className="text-slate-300 font-mono text-xs dir-ltr inline-block">
          {c.phone || 'ثبت نشده'}
        </span>
      ),
    },
    {
      key: 'sport',
      header: 'رشته ورزشی',
      sortable: true,
      render: (c) => {
        const sportText = getSportName(c);
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20 inline-flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 shrink-0" />
            <span>{sportText}</span>
          </span>
        );
      },
    },
    {
      key: 'join_date',
      header: 'تاریخ عضویت',
      sortable: true,
      render: (c) => (
        <span className="text-slate-400 font-mono text-xs inline-flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{c.join_date || '—'}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="مدیریت مشتریان و ورزشکاران باشگاه"
        subtitle={`مدیریت لیست اعضا، پرونده‌ها و حساب‌های ثبت‌شده در باشگاه (شناسه: #${selectedGymId})`}
        quickActionLabel="افزودن مشتری جدید"
        onQuickAction={openCreateModal}
      />

      <div className="p-4 bg-[#141414] border border-[#262626] rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-500">باشگاه فعال:</span>
          <span className="font-black text-white">{currentGym?.gym_name || `باشگاه #${selectedGymId}`}</span>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loadingCustomers}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-slate-300 text-xs font-bold transition-all border border-[#333] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomers ? 'animate-spin text-[#FF7A1A]' : ''}`} />
          <span>بروزرسانی لیست</span>
        </button>
      </div>

      {loadingCustomers ? (
        <div className="p-12 text-center text-slate-400 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#FF7A1A] animate-spin" />
          <span className="text-xs">در حال دریافت لیست مشتریان باشگاه از سرور...</span>
        </div>
      ) : customerError ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{customerError}</span>
          </div>
          <button
            onClick={fetchCustomers}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-bold cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCustomers}
          searchPlaceholder="جستجوی نام، شماره همراه، رشته ورزشی..."
          searchKeys={['full_name', 'phone', 'sport_name']}
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A] cursor-pointer"
              >
                <option value="all">همه رشته‌های ورزشی</option>
                {allSports.map((sport) => (
                  <option key={sport.id} value={String(sport.id)}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>
          }
          actions={(customer) => (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleViewDetail(customer)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#282828] rounded-lg transition-colors cursor-pointer"
                title="مشاهده جزئیات کامل"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={() => openEditModal(customer)}
                className="p-1.5 text-slate-400 hover:text-[#FF7A1A] hover:bg-[#FF7A1A]/10 rounded-lg transition-colors cursor-pointer"
                title="ویرایش مشتری"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeletingCustomer(customer)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="حذف مشتری"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      )}

      {/* CREATE CUSTOMER MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="افزودن مشتری / ورزشکار جدید به باشگاه">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{modalError}</span>
            </div>
          )}

          <FormField
            label="نام و نام خانوادگی"
            required
            placeholder="مثلا: علی محمدی"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />

          <FormField
            label="شماره تماس"
            required
            placeholder="09121112233"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          {/* Sport Select Dropdown */}
          <div className="space-y-1">
            <FormField
              label="رشته ورزشی"
              isSelect
              value={formData.sport ? String(formData.sport) : ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, sport: val ? parseInt(val, 10) : null });
              }}
              options={[
                { value: '', label: 'بدون انتخاب رشته ورزشی (اختیاری)' },
                ...allSports.map((s) => ({
                  value: String(s.id),
                  label: s.name,
                })),
              ]}
            />
          </div>

          <FormField
            label="تاریخ عضویت"
            type="date"
            placeholder="YYYY-MM-DD"
            value={formData.join_date}
            onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-[#333] text-slate-300 hover:bg-[#222] text-xs font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'در حال ثبت...' : 'ذخیره و ثبت مشتری'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <Modal
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          title={`ویرایش اطلاعات مشتری: ${editingCustomer.full_name}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            {loadingCustomerDetail && (
              <div className="p-3 bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 rounded-xl text-[#FF7A1A] text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>در حال به‌روزرسانی اطلاعات مشتری از سرور...</span>
              </div>
            )}

            <FormField
              label="نام و نام خانوادگی"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />

            <FormField
              label="شماره تماس"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            {/* Sport Select Dropdown */}
            <FormField
              label="رشته ورزشی"
              isSelect
              value={formData.sport ? String(formData.sport) : ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, sport: val ? parseInt(val, 10) : null });
              }}
              options={[
                { value: '', label: 'بدون انتخاب رشته ورزشی (اختیاری)' },
                ...allSports.map((s) => ({
                  value: String(s.id),
                  label: s.name,
                })),
              ]}
            />

            <FormField
              label="تاریخ عضویت"
              type="date"
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2.5 rounded-xl border border-[#333] text-slate-300 hover:bg-[#222] text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره و ویرایش اطلاعات'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW CUSTOMER DETAIL MODAL */}
      {viewingCustomer && (
        <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title="پرونده و مشخصات کامل مشتری">
          <div className="space-y-6">
            {loadingCustomerDetail && (
              <div className="p-3 bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 rounded-xl text-[#FF7A1A] text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>در حال دریافت تازه‌ترین اطلاعات از سرور...</span>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#141414] border border-[#262626]">
              <div className="w-16 h-16 rounded-2xl bg-[#222] border-2 border-[#FF7A1A] overflow-hidden flex items-center justify-center text-[#FF7A1A] shrink-0">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">{viewingCustomer.full_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20">
                    شناسه مشتری: #{viewingCustomer.id}
                  </span>
                  {viewingCustomer.is_fitopia_user && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      کاربر فیتوپیا
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  شماره همراه:
                </span>
                <span className="font-mono text-slate-200 block text-sm dir-ltr text-right">
                  {viewingCustomer.phone || 'ثبت نشده'}
                </span>
              </div>

              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  رشته ورزشی:
                </span>
                <span className="font-bold text-slate-200 block text-sm">
                  {getSportName(viewingCustomer)}
                </span>
              </div>

              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  تاریخ پیوستن:
                </span>
                <span className="font-mono text-slate-200 block text-sm">
                  {viewingCustomer.join_date || '—'}
                </span>
              </div>

              {viewingCustomer.created_at && (
                <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FF7A1A]" />
                    تاریخ ثبت پرونده:
                  </span>
                  <span className="font-mono text-slate-200 block text-xs">
                    {new Date(viewingCustomer.created_at).toLocaleString('fa-IR')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#262626]">
              <button
                onClick={() => setViewingCustomer(null)}
                className="px-5 py-2 rounded-xl bg-[#222] hover:bg-[#2C2C2C] text-slate-200 text-xs font-bold cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE CUSTOMER MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingCustomer?.full_name || ''}
        description="آیا از حذف این مشتری از باشگاه اطمینان دارید؟ تمامی سوابق عضویت این حساب حذف می‌شود."
      />
    </div>
  );
};
