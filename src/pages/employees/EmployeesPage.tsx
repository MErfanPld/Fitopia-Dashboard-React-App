import React, { useCallback, useEffect, useState } from 'react';
import { Shield, RefreshCw, UserPlus, Edit3, Trash2 } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import employeesService from '../../services/employees/employeesService';
import {
  ROLE_LABELS,
  PERMISSION_LABELS,
  ALL_PERMISSIONS,
  type PermissionCode,
  type StaffEmployee,
  type StaffRole,
} from '../../types/api';

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

export const EmployeesPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('employee.view');
  const { showToast } = useUI();
  const [items, setItems] = useState<StaffEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permTarget, setPermTarget] = useState<StaffEmployee | null>(null);
  const [codes, setCodes] = useState<PermissionCode[]>([]);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffEmployee | null>(null);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<string>('staff');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [deleting, setDeleting] = useState<StaffEmployee | null>(null);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await employeesService.list(gymId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'دریافت اطلاعات با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('employee.view')) load();
  }, [hasGym, load, can]);

  const openCreate = () => {
    setEditing(null);
    setUserId('');
    setRole('staff');
    setEmployeeNumber('');
    setIsActive(true);
    setFormOpen(true);
  };

  const openEdit = (r: StaffEmployee) => {
    setEditing(r);
    setUserId(String(r.user));
    setRole(r.role || 'staff');
    setEmployeeNumber(r.employee_number || '');
    setIsActive(r.is_active !== false);
    setFormOpen(true);
  };

  const save = async () => {
    if (!gymId) return;
    if (!editing && !userId.trim()) {
      showToast('شناسه کاربر (user) الزامی است. کارمند باید کاربر موجود در سیستم باشد.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await employeesService.update(gymId, editing.id, {
          role,
          employee_number: employeeNumber || undefined,
          is_active: isActive,
        });
        showToast('کارمند بروزرسانی شد.', 'success');
      } else {
        await employeesService.create(gymId, {
          user: Number(userId),
          role,
          employee_number: employeeNumber || undefined,
          is_active: isActive,
        });
        showToast('کارمند ثبت شد.', 'success');
      }
      setFormOpen(false);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ذخیره', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<StaffEmployee>[] = [
    { key: 'username', header: 'کاربر', render: (r) => <span className="text-ink">{r.username || r.user}</span> },
    { key: 'user_phone', header: 'تلفن', render: (r) => <span className="text-muted">{r.user_phone || '—'}</span> },
    {
      key: 'role',
      header: 'نقش',
      render: (r) => <span className="text-secondary">{ROLE_LABELS[r.role as StaffRole] || r.role}</span>,
    },
    {
      key: 'is_active',
      header: 'وضعیت',
      render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} />,
    },
  ];

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="کارکنان" />
        <NoGymSelected />
      </div>
    );
  }
  if (!can('employee.view')) {
    return (
      <div className="space-y-6">
        <Header title="کارکنان" />
        <EmptyState title="دسترسی ندارید" description="مجوز مشاهده کارکنان برای نقش شما فعال نیست." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="کارکنان"
        subtitle="مدیریت کارمندان و دسترسی‌ها"
        onQuickAction={can('employee.manage') ? openCreate : undefined}
        quickActionLabel={can('employee.manage') ? 'کارمند جدید' : undefined}
      />
      <div className="flex justify-end">
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-muted">
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </button>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="کارمندی ثبت نشده" description="برای افزودن کارمند، شناسه کاربر موجود در سیستم فیتوپیا لازم است." />
      )}
      {!loading && !error && items.length > 0 && (
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['username', 'user_phone']}
          actions={(r) =>
            can('employee.manage') ? (
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 text-muted hover:text-primary" title="ویرایش" onClick={() => openEdit(r)}>
                  <Edit3 className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 text-muted hover:text-primary" title="مجوزها" onClick={() => { setPermTarget(r); setCodes((r.permission_codes || []) as PermissionCode[]); }}>
                  <Shield className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 text-muted hover:text-danger-text" title="حذف" onClick={() => setDeleting(r)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null
          }
        />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'ویرایش کارمند' : 'کارمند جدید'}>
        <div className="space-y-4">
          {!editing && (
            <FormField label="شناسه کاربر (user id)" required type="number" value={userId} onChange={(e) => setUserId(e.target.value)} helpText="شناسه کاربر موجود در سیستم فیتوپیا" />
          )}
          <FormField label="نقش" isSelect value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTIONS} />
          <FormField label="کد پرسنلی" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-primary" />
            فعال
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={save} className="px-4 py-2 text-sm bg-primary text-[#0B0B0F] font-bold rounded-lg disabled:opacity-50">
              {saving ? '...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!permTarget} onClose={() => setPermTarget(null)} title="تنظیم مجوزها">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {ALL_PERMISSIONS.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={codes.includes(code)}
                onChange={(e) => {
                  setCodes((prev) => e.target.checked ? [...prev, code] : prev.filter((c) => c !== code));
                }}
                className="accent-primary"
              />
              {PERMISSION_LABELS[code] || code}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={() => setPermTarget(null)} className="px-4 py-2 text-sm text-muted">انصراف</button>
          <button
            type="button"
            disabled={saving}
            className="px-4 py-2 text-sm bg-primary text-[#0B0B0F] font-bold rounded-lg"
            onClick={async () => {
              if (!gymId || !permTarget) return;
              setSaving(true);
              try {
                await employeesService.setPermissions(gymId, permTarget.id, codes);
                showToast('مجوزها ذخیره شد', 'success');
                setPermTarget(null);
                load();
              } catch (e: unknown) {
                showToast(e instanceof Error ? e.message : 'خطا', 'danger');
              } finally {
                setSaving(false);
              }
            }}
          >ذخیره</button>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        itemName={deleting?.username || String(deleting?.id || '')}
        loading={saving}
        onConfirm={async () => {
          if (!gymId || !deleting) return;
          setSaving(true);
          try {
            await employeesService.remove(gymId, deleting.id);
            showToast('حذف شد', 'success');
            setDeleting(null);
            load();
          } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'خطا', 'danger');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
};
