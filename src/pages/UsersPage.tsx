import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { FormField } from '../components/common/FormField';
import { UserRole, UserStatus } from '../types';
import customerService, { GymCustomer } from '../services/customerService';
import { UserPlus, Eye, Edit3, Trash2, Phone, Mail, Calendar, Building, RefreshCw, UserCheck, Shield } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { currentGym, gymAccessList } = useAuth();
  const selectedGymId = currentGym?.gym || currentGym?.id || gymAccessList[0]?.gym || gymAccessList[0]?.id || 1;

  // Customers state from API / Local
  const [customers, setCustomers] = useState<GymCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<GymCustomer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<GymCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<GymCustomer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    national_code: '',
    gender: 'male',
    status: 'active',
    image: '',
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
      setCustomerError('خطا در دریافت لیست مشتریان.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [selectedGymId]);

  const openCreateModal = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      national_code: '',
      gender: 'male',
      status: 'active',
      image: '',
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (c: GymCustomer) => {
    setEditingCustomer(c);
    setFormData({
      full_name: c.full_name || '',
      phone: c.phone || '',
      email: c.email || '',
      national_code: c.national_code || '',
      gender: c.gender || 'male',
      status: c.status || 'active',
      image: c.image || '',
    });
  };

  const handleViewDetail = async (c: GymCustomer) => {
    setViewingCustomer(c);
    try {
      const detail = await customerService.getCustomer(selectedGymId, c.id);
      if (detail) {
        setViewingCustomer(detail);
      }
    } catch (e) {
      console.warn('Could not fetch extra detail from API, showing loaded state:', e);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;

    setIsSaving(true);
    try {
      await customerService.createCustomer(selectedGymId, {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        national_code: formData.national_code,
        gender: formData.gender,
        status: formData.status,
        image: formData.image,
      });
      setIsCreateOpen(false);
      fetchCustomers();
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      alert(err.message || 'خطا در ثبت مشتری جدید.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !formData.full_name.trim()) return;

    setIsSaving(true);
    try {
      await customerService.updateCustomer(selectedGymId, editingCustomer.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        national_code: formData.national_code,
        gender: formData.gender,
        status: formData.status,
        image: formData.image,
      });
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      alert(err.message || 'خطا در بروزرسانی مشتری.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    try {
      await customerService.deleteCustomer(selectedGymId, deletingCustomer.id);
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      alert(err.message || 'خطا در حذف مشتری.');
    }
  };

  // Filtered dataset
  const filteredCustomers = customers.filter((c) => {
    if (statusFilter !== 'all' && (c.status || 'active') !== statusFilter) return false;
    if (genderFilter !== 'all' && (c.gender || 'male') !== genderFilter) return false;
    return true;
  });

  // Data Table Columns
  const columns: Column<GymCustomer>[] = [
    {
      key: 'full_name',
      header: 'نام و مشخصات کاربر',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#222] border border-[#333] overflow-hidden flex items-center justify-center text-[#FF7A1A] shrink-0">
            {c.image ? (
              <img src={c.image} alt={c.full_name} className="w-full h-full object-cover" />
            ) : (
              <UserCheck className="w-5 h-5" />
            )}
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
      key: 'email',
      header: 'آدرس ایمیل',
      sortable: true,
      render: (c) => (
        <span className="text-slate-400 font-mono text-xs dir-ltr inline-block truncate max-w-[150px]">
          {c.email || '—'}
        </span>
      ),
    },
    {
      key: 'gender',
      header: 'جنسیت',
      sortable: true,
      render: (c) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#222] text-slate-300 border border-[#333]">
          {c.gender === 'female' ? 'خانم' : 'آقا'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'وضعیت حساب',
      sortable: true,
      render: (c) => <StatusBadge status={(c.status as any) || 'active'} />,
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-slate-300 text-xs font-bold transition-all border border-[#333]"
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
          <span>{customerError}</span>
          <button
            onClick={fetchCustomers}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-bold"
          >
            تلاش مجدد
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCustomers}
          searchPlaceholder="جستجوی نام، شماره همراه، ایمیل..."
          searchKeys={['full_name', 'phone', 'email', 'national_code']}
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A]"
              >
                <option value="all">همه جنسیت‌ها</option>
                <option value="male">آقا</option>
                <option value="female">خانم</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A]"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="suspended">مسدود</option>
              </select>
            </div>
          }
          actions={(customer) => (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleViewDetail(customer)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#282828] rounded-lg transition-colors"
                title="مشاهده جزئیات کامل"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={() => openEditModal(customer)}
                className="p-1.5 text-slate-400 hover:text-[#FF7A1A] hover:bg-[#FF7A1A]/10 rounded-lg transition-colors"
                title="ویرایش مشتری"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeletingCustomer(customer)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
          <FormField
            label="نام و نام خانوادگی"
            required
            placeholder="مثلا: رضا علوی"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="شماره همراه"
              placeholder="09121112233"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <FormField
              label="کد ملی"
              placeholder="0012345678"
              value={formData.national_code}
              onChange={(e) => setFormData({ ...formData, national_code: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="آدرس ایمیل"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormField
              label="جنسیت"
              isSelect
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              options={[
                { value: 'male', label: 'آقا' },
                { value: 'female', label: 'خانم' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="وضعیت حساب"
              isSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'فعال' },
                { value: 'inactive', label: 'غیرفعال' },
                { value: 'suspended', label: 'مسدود' },
              ]}
            />
            <FormField
              label="آدرس تصویر (URL)"
              placeholder="https://..."
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>

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
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20 disabled:opacity-50"
            >
              {isSaving ? 'در حال ثبت...' : 'ذخیره و ثبت مشتری'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title={`ویرایش اطلاعات: ${editingCustomer.full_name}`}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <FormField
              label="نام و نام خانوادگی"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="شماره همراه"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <FormField
                label="کد ملی"
                value={formData.national_code}
                onChange={(e) => setFormData({ ...formData, national_code: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="آدرس ایمیل"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <FormField
                label="جنسیت"
                isSelect
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[
                  { value: 'male', label: 'آقا' },
                  { value: 'female', label: 'خانم' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="وضعیت حساب"
                isSelect
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'active', label: 'فعال' },
                  { value: 'inactive', label: 'غیرفعال' },
                  { value: 'suspended', label: 'مسدود' },
                ]}
              />
              <FormField
                label="آدرس تصویر (URL)"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2.5 rounded-xl border border-[#333] text-slate-300 hover:bg-[#222] text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20 disabled:opacity-50"
              >
                {isSaving ? 'در حال ذخیره...' : 'ذخیره و ویرایش اطلاعات'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW CUSTOMER DETAIL MODAL */}
      {viewingCustomer && (
        <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title="پرونده و مشخصات کامل مشتری">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#141414] border border-[#262626]">
              <div className="w-16 h-16 rounded-2xl bg-[#222] border-2 border-[#FF7A1A] overflow-hidden flex items-center justify-center text-[#FF7A1A] shrink-0">
                {viewingCustomer.image ? (
                  <img src={viewingCustomer.image} alt={viewingCustomer.full_name} className="w-full h-full object-cover" />
                ) : (
                  <UserCheck className="w-8 h-8" />
                )}
              </div>
              <div>
                <h4 className="text-lg font-black text-white">{viewingCustomer.full_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20">
                    شناسه مشتری: #{viewingCustomer.id}
                  </span>
                  <StatusBadge status={(viewingCustomer.status as any) || 'active'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  شماره همراه:
                </span>
                <span className="font-mono text-slate-200 block text-sm dir-ltr text-right">{viewingCustomer.phone || 'ثبت نشده'}</span>
              </div>

              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  پست الکترونیک:
                </span>
                <span className="font-mono text-slate-200 block text-sm dir-ltr text-right">{viewingCustomer.email || 'ثبت نشده'}</span>
              </div>

              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  کد ملی:
                </span>
                <span className="font-mono text-slate-200 block text-sm">{viewingCustomer.national_code || 'ثبت نشده'}</span>
              </div>

              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  تاریخ پیوستن:
                </span>
                <span className="font-mono text-slate-200 block text-sm">{viewingCustomer.join_date || 'امروز'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#262626]">
              <button
                onClick={() => setViewingCustomer(null)}
                className="px-5 py-2 rounded-xl bg-[#222] hover:bg-[#2C2C2C] text-slate-200 text-xs font-bold"
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

