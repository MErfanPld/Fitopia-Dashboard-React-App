import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { FormField } from '../components/common/FormField';
import { User, UserRole, UserStatus } from '../types';
import { UserPlus, Eye, Edit3, Trash2, Shield, Phone, Mail, Calendar, Building } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, gyms } = useApp();

  // Filters state
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member' as UserRole,
    status: 'active' as UserStatus,
    gymName: 'باشگاه اکسیژن پلاس',
    password: '',
  });

  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'member',
      status: 'active',
      gymName: gyms[0]?.name || 'باشگاه اکسیژن پلاس',
      password: '',
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      gymName: user.gymName || 'باشگاه اکسیژن پلاس',
      password: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    addUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '09120000000',
      role: formData.role,
      status: formData.status,
      gymName: formData.gymName,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    });
    setIsCreateOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      status: formData.status,
      gymName: formData.gymName,
    });
    setEditingUser(null);
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
      setDeletingUser(null);
    }
  };

  // Filtered dataset
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  // Data Table Columns
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'نام و تصویر کاربر',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border border-[#2E2E2E]"
          />
          <div>
            <span className="font-bold text-white block">{user.name}</span>
            <span className="text-[11px] text-slate-400 dir-ltr inline-block">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'نقش کاربری',
      sortable: true,
      render: (user) => <StatusBadge status={user.role} />,
    },
    {
      key: 'gymName',
      header: 'باشگاه مرتبط',
      sortable: true,
      render: (user) => (
        <span className="text-slate-300 text-xs font-medium">{user.gymName || 'بدون مجموعه'}</span>
      ),
    },
    {
      key: 'status',
      header: 'وضعیت حساب',
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'joinDate',
      header: 'تاریخ عضویت',
      sortable: true,
      render: (user) => <span className="text-slate-400 font-mono text-xs">{user.joinDate}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="مدیریت کاربران و اعضا"
        subtitle="مدیریت تمام مدیران، مربیان، پشتیبانان و ورزشکاران ثبت‌شده"
        quickActionLabel="افزودن کاربر جدید"
        onQuickAction={openCreateModal}
      />

      {/* Filter Component Slot */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        searchPlaceholder="جستجوی نام، ایمیل، شماره یا باشگاه..."
        searchKeys={['name', 'email', 'phone', 'gymName']}
        filterComponent={
          <div className="flex items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A]"
            >
              <option value="all">همه نقش‌ها</option>
              <option value="admin">مدیر کل</option>
              <option value="manager">مدیر باشگاه</option>
              <option value="coach">مربی</option>
              <option value="member">ورزشکار</option>
              <option value="support">پشتیبان</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A]"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="pending">در انتظار</option>
              <option value="suspended">مسدود</option>
            </select>
          </div>
        }
        actions={(user) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewingUser(user)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#282828] rounded-lg transition-colors"
              title="مشاهده جزئیات"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => openEditModal(user)}
              className="p-1.5 text-slate-400 hover:text-[#FF7A1A] hover:bg-[#FF7A1A]/10 rounded-lg transition-colors"
              title="ویرایش کاربر"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDeletingUser(user)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="حذف کاربر"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* CREATE USER MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="افزودن کاربر جدید به سامانه">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <FormField
            label="نام و نام خانوادگی"
            required
            placeholder="مثلا: علی محمدی"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="آدرس ایمیل"
              type="email"
              required
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormField
              label="شماره همراه"
              placeholder="09121112233"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="نقش کاربر در سامانه"
              isSelect
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { value: 'member', label: 'ورزشکار / عضو عادی' },
                { value: 'coach', label: 'مربی تخصصی' },
                { value: 'manager', label: 'مدیر باشگاه' },
                { value: 'support', label: 'کارشناس پشتیبانی' },
                { value: 'admin', label: 'مدیر کل فیتوپیا' },
              ]}
            />

            <FormField
              label="وضعیت اولیه حساب"
              isSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              options={[
                { value: 'active', label: 'فعال' },
                { value: 'pending', label: 'در انتظار تایید' },
                { value: 'inactive', label: 'غیرفعال' },
                { value: 'suspended', label: 'معلق' },
              ]}
            />
          </div>

          <FormField
            label="باشگاه انتخابی"
            isSelect
            value={formData.gymName}
            onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
            options={gyms.map((g) => ({ value: g.name, label: `${g.name} (${g.city})` }))}
          />

          <FormField
            label="کلمه عبور اولیه"
            type="password"
            placeholder="حداقل ۶ کاراکتر"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20"
            >
              ذخیره و ایجاد کاربر
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="ویرایش اطلاعات کاربر">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <FormField
            label="نام و نام خانوادگی"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="آدرس ایمیل"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormField
              label="شماره همراه"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="نقش کاربر"
              isSelect
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { value: 'member', label: 'ورزشکار' },
                { value: 'coach', label: 'مربی' },
                { value: 'manager', label: 'مدیر باشگاه' },
                { value: 'support', label: 'پشتیبان' },
                { value: 'admin', label: 'مدیر کل' },
              ]}
            />

            <FormField
              label="وضعیت حساب"
              isSelect
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              options={[
                { value: 'active', label: 'فعال' },
                { value: 'inactive', label: 'غیرفعال' },
                { value: 'pending', label: 'در انتظار' },
                { value: 'suspended', label: 'مسدود' },
              ]}
            />
          </div>

          <FormField
            label="باشگاه مرتبط"
            isSelect
            value={formData.gymName}
            onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
            options={gyms.map((g) => ({ value: g.name, label: g.name }))}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2.5 rounded-xl border border-[#333] text-slate-300 hover:bg-[#222] text-xs font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20"
            >
              بروزرسانی اطلاعات
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW USER DETAIL MODAL */}
      {viewingUser && (
        <Modal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} title="پروفایل و شناسنامه کاربر">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#141414] border border-[#262626]">
              <img
                src={viewingUser.avatar}
                alt={viewingUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF7A1A]"
              />
              <div>
                <h4 className="text-lg font-black text-white">{viewingUser.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={viewingUser.role} />
                  <StatusBadge status={viewingUser.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  پست الکترونیک:
                </span>
                <span className="font-mono text-slate-200 block text-sm">{viewingUser.email}</span>
              </div>

              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  شماره تماس:
                </span>
                <span className="font-mono text-slate-200 block text-sm">{viewingUser.phone}</span>
              </div>

              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  مجموعه مرتبط:
                </span>
                <span className="text-slate-200 block text-sm font-bold">{viewingUser.gymName || 'پشتیبانی مرکزی'}</span>
              </div>

              <div className="p-3.5 bg-[#141414] rounded-xl border border-[#242424] space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  تاریخ ثبت‌نام:
                </span>
                <span className="font-mono text-slate-200 block text-sm">{viewingUser.joinDate}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#262626]">
              <button
                onClick={() => setViewingUser(null)}
                className="px-5 py-2 rounded-xl bg-[#222] hover:bg-[#2C2C2C] text-slate-200 text-xs font-bold"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL (Styled with Warning Red) */}
      <ConfirmDeleteModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingUser?.name || ''}
        description="آیا از حذف این کاربر اطمینان دارید؟ سوابق تمرینی و مالی کاربر مربوطه نیز از دسترس خارج می‌شود."
      />
    </div>
  );
};
