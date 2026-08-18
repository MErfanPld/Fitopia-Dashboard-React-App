import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, RefreshCw, UserPlus, Edit3, Trash2, Eye, UserCog } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import employeesService from '../../services/employees/employeesService';
import membersService from '../../services/members/membersService';
import {
  ROLE_LABELS,
  ROLE_DEFAULTS,
  PERMISSION_LABELS,
  ALL_PERMISSIONS,
  type PermissionCode,
  type StaffEmployee,
  type StaffEmployeeInput,
  type StaffRole,
} from '../../types/api';
import { formatJalaliNumeric, formatJalaliDateTime } from '../../utils/jalaliUtils';

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

function roleLabel(role?: string | null): string {
  if (!role) return '—';
  return ROLE_LABELS[role as StaffRole] || role;
}

function parsePermissionCodes(raw?: string[] | string | null): PermissionCode[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((c): c is PermissionCode => ALL_PERMISSIONS.includes(c as PermissionCode));
  }
  const parts = String(raw)
    .replace(/[\[\]"']/g, '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.filter((c): c is PermissionCode => ALL_PERMISSIONS.includes(c as PermissionCode));
}

function displayName(e?: StaffEmployee | null): string {
  if (!e) return '—';
  return e.username || e.user_phone || (e.user != null ? `کاربر ${e.user}` : 'کارمند');
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-ink font-medium text-left">{value}</span>
    </div>
  );
}

export const EmployeesPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('employee.view');
  const { showToast } = useUI();
  const canManage = can('employee.manage');

  const [items, setItems] = useState<StaffEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffEmployee | null>(null);
  const [userId, setUserId] = useState('');
  const [fitopiaCandidates, setFitopiaCandidates] = useState<{ id: number; label: string }[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [role, setRole] = useState<string>('staff');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [permTarget, setPermTarget] = useState<StaffEmployee | null>(null);
  const [codes, setCodes] = useState<PermissionCode[]>([]);
  const [deleting, setDeleting] = useState<StaffEmployee | null>(null);
  const [detail, setDetail] = useState<StaffEmployee | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await employeesService.list(gymId);
      setItems((list || []).filter((x): x is StaffEmployee => !!x && typeof x === 'object' && x.id != null));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت کارکنان');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('employee.view')) load();
  }, [hasGym, load, can]);

  const filtered = useMemo(() => {
    let rows = items.filter(Boolean);
    if (roleFilter !== 'all') rows = rows.filter((r) => r.role === roleFilter);
    if (activeFilter === 'active') rows = rows.filter((r) => r.is_active !== false);
    if (activeFilter === 'inactive') rows = rows.filter((r) => r.is_active === false);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.username || '').toLowerCase().includes(q) ||
          (r.user_phone || '').includes(q) ||
          (r.employee_number || '').toLowerCase().includes(q) ||
          roleLabel(r.role).includes(q),
      );
    }
    return rows;
  }, [items, search, roleFilter, activeFilter]);

  const loadFitopiaCandidates = useCallback(async () => {
    if (!gymId) return;
    setCandidatesLoading(true);
    try {
      const members = await membersService.list(gymId);
      const map = new Map<number, string>();
      for (const m of members || []) {
        const uid = m.fitopia_user;
        if (uid == null || Number(uid) <= 0) continue;
        const id = Number(uid);
        const label = [m.full_name, m.phone].filter(Boolean).join(' — ') || `کاربر ${id}`;
        if (!map.has(id)) map.set(id, label);
      }
      for (const e of items) {
        if (e?.user != null && e.user > 0) {
          const label = [e.username, e.user_phone].filter(Boolean).join(' — ') || `کاربر ${e.user}`;
          if (!map.has(e.user)) map.set(e.user, label);
        }
      }
      setFitopiaCandidates(
        Array.from(map.entries())
          .map(([id, label]) => ({ id, label }))
          .sort((a, b) => a.label.localeCompare(b.label, 'fa')),
      );
    } catch {
      setFitopiaCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }, [gymId, items]);

  const openCreate = () => {
    setEditing(null);
    setUserId('');
    setRole('staff');
    setEmployeeNumber('');
    setIsActive(true);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setFormErrors({});
    setFormOpen(true);
    void loadFitopiaCandidates();
  };

  const openEdit = async (r: StaffEmployee) => {
    if (!r) return;
    setEditing(r);
    setUserId(String(r.user ?? ''));
    setRole(String(r.role || 'staff'));
    setEmployeeNumber(r.employee_number || '');
    setIsActive(r.is_active !== false);
    setStartDate(r.start_date || '');
    setEndDate(r.end_date || '');
    setFormErrors({});
    setFormOpen(true);
    if (!gymId) return;
    try {
      const fresh = await employeesService.get(gymId, r.id);
      if (!fresh) return;
      setEditing(fresh);
      setUserId(String(fresh.user ?? ''));
      setRole(String(fresh.role || 'staff'));
      setEmployeeNumber(fresh.employee_number || '');
      setIsActive(fresh.is_active !== false);
      setStartDate(fresh.start_date || '');
      setEndDate(fresh.end_date || '');
    } catch {
      /* keep */
    }
  };

  const openDetail = async (r: StaffEmployee) => {
    if (!r) return;
    setDetail(r);
    if (!gymId) return;
    setDetailLoading(true);
    try {
      setDetail(await employeesService.get(gymId, r.id));
    } catch {
      /* keep */
    } finally {
      setDetailLoading(false);
    }
  };

  const openPermissions = (r: StaffEmployee) => {
    if (!r) return;
    const existing = parsePermissionCodes(r.permission_codes);
    if (existing.length) setCodes(existing);
    else setCodes([...(ROLE_DEFAULTS[r.role as StaffRole] || [])]);
    setPermTarget(r);
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!editing) {
      const uid = Number(userId);
      if (!userId.trim() || !Number.isInteger(uid) || uid <= 0) {
        errs.user = 'لطفاً یک کاربر فیتوپیا را از لیست انتخاب کنید.';
      }
    }
    if (!role) errs.role = 'نقش را انتخاب کنید.';
    if (startDate && endDate && startDate > endDate) {
      errs.end_date = 'تاریخ پایان نباید قبل از شروع باشد.';
    }
    return errs;
  };

  const handleSave = async () => {
    if (!gymId) return;
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) {
      showToast(Object.values(errs)[0], 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload: StaffEmployeeInput = {
        user: Number(userId),
        role,
        is_active: isActive,
        start_date: startDate || null,
        end_date: endDate || null,
        employee_number: employeeNumber.trim(),
      };
      if (editing) {
        const { user: _u, ...rest } = payload;
        await employeesService.update(gymId, editing.id, rest);
        showToast('اطلاعات کارمند با موفقیت ویرایش شد', 'success');
      } else {
        await employeesService.create(gymId, payload);
        showToast('کارمند با موفقیت اضافه شد', 'success');
      }
      setFormOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    setSaving(true);
    try {
      await employeesService.remove(gymId, deleting.id);
      showToast('کارمند با موفقیت حذف شد', 'success');
      setDeleting(null);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!gymId || !permTarget) return;
    setSaving(true);
    try {
      await employeesService.setPermissions(gymId, permTarget.id, codes);
      showToast('مجوزها با موفقیت ذخیره شد', 'success');
      setPermTarget(null);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<StaffEmployee>[] = [
    {
      key: 'username',
      header: 'کارمند',
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-soft border border-border shrink-0 flex items-center justify-center">
            <UserCog className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-ink truncate">{displayName(r)}</p>
            {r?.employee_number ? <p className="text-[11px] text-muted">کد پرسنلی: {r.employee_number}</p> : null}
          </div>
        </div>
      ),
    },
    {
      key: 'user_phone',
      header: 'موبایل',
      render: (r) => <span className="text-muted text-sm dir-ltr font-mono">{r?.user_phone || '—'}</span>,
    },
    {
      key: 'role',
      header: 'نقش',
      render: (r) => (
        <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium bg-surface-elevated border border-border text-secondary">
          {roleLabel(r?.role)}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'وضعیت',
      render: (r) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium border ${
            r?.is_active !== false
              ? 'bg-success-soft text-success-text border-success/20'
              : 'bg-danger-soft text-danger-text border-danger/20'
          }`}
        >
          {r?.is_active !== false ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
    {
      key: 'start_date',
      header: 'شروع همکاری',
      render: (r) => (
        <span className="text-sm text-muted tabular-nums">
          {r?.start_date ? formatJalaliNumeric(r.start_date) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-36',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openDetail(r)}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover"
            aria-label="مشاهده جزئیات"
            title="مشاهده"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft"
                aria-label="ویرایش کارمند"
                title="ویرایش"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openPermissions(r)}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft"
                aria-label="تنظیم مجوزها"
                title="مجوزها"
              >
                <Shield className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(r)}
                className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-danger-soft"
                aria-label="حذف کارمند"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!hasGym) return <NoGymSelected />;

  if (!can('employee.view')) {
    return (
      <div className="space-y-4">
        <Header title="کارکنان" subtitle="مدیریت کارکنان و دسترسی‌ها" />
        <ErrorBlock message="شما دسترسی مشاهده کارکنان را ندارید." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        title="کارکنان"
        subtitle="مدیریت کارکنان باشگاه، نقش‌ها و مجوزها"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"
              >
                <UserPlus className="w-4 h-4" />
                کارمند جدید
              </button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو نام کاربری، موبایل یا کد پرسنلی..."
          className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
        >
          <option value="all">همه نقش‌ها</option>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
          className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </select>
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !items.length ? (
        <LoadingBlock />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          title="کارمندی یافت نشد"
          description={items.length ? 'با فیلترهای فعلی نتیجه‌ای نیست.' : 'هنوز کارمندی ثبت نشده است.'}
          action={
            canManage && !items.length ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"
              >
                <UserPlus className="w-4 h-4" />
                افزودن اولین کارمند
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'ویرایش کارمند' : 'کارمند جدید'}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {editing ? (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted">کاربر فیتوپیا</p>
              <div className="rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5">
                <p className="text-sm font-medium text-ink">{editing.username || '—'}</p>
                {editing.user_phone ? (
                  <p className="text-xs text-muted dir-ltr font-mono mt-0.5">{editing.user_phone}</p>
                ) : null}
              </div>
              <p className="text-[11px] text-muted">کاربر پس از ثبت قابل تغییر نیست.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <FormField
                label="کاربر فیتوپیا"
                required
                isSelect
                value={userId}
                error={formErrors.user}
                options={[
                  {
                    value: '',
                    label: candidatesLoading ? 'در حال بارگذاری...' : 'انتخاب کاربر (نام / موبایل)',
                  },
                  ...fitopiaCandidates.map((c) => ({ value: String(c.id), label: c.label })),
                ]}
                onChange={(e) => setUserId(e.target.value)}
                helpText={
                  fitopiaCandidates.length
                    ? 'فقط کاربرانی که حساب فیتوپیا دارند (از اعضای باشگاه) نمایش داده می‌شوند.'
                    : 'عضوی با حساب فیتوپیا یافت نشد. ابتدا عضو را با کاربر فیتوپیا ثبت کنید.'
                }
              />
            </div>
          )}
          <FormField
            label="نقش"
            required
            isSelect
            value={role}
            error={formErrors.role}
            options={ROLE_OPTIONS}
            onChange={(e) => setRole(e.target.value)}
          />
          <FormField
            label="کد پرسنلی"
            value={employeeNumber}
            placeholder="اختیاری"
            onChange={(e) => setEmployeeNumber(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <JalaliDatePicker label="تاریخ شروع" value={startDate} onChange={setStartDate} />
            <div>
              <JalaliDatePicker label="تاریخ پایان" value={endDate} onChange={setEndDate} />
              {formErrors.end_date && (
                <p className="text-[11px] text-danger-text mt-1">{formErrors.end_date}</p>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border"
            />
            کارمند فعال است
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات کارمند">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm">
            <DetailRow label="نام کاربری" value={detail.username || '—'} />
            <DetailRow label="موبایل" value={detail.user_phone || '—'} />
            <DetailRow label="نقش" value={roleLabel(detail.role)} />
            <DetailRow label="کد پرسنلی" value={detail.employee_number || '—'} />
            <DetailRow label="وضعیت" value={detail.is_active !== false ? 'فعال' : 'غیرفعال'} />
            <DetailRow
              label="شروع همکاری"
              value={detail.start_date ? formatJalaliNumeric(detail.start_date) : '—'}
            />
            <DetailRow
              label="پایان همکاری"
              value={detail.end_date ? formatJalaliNumeric(detail.end_date) : '—'}
            />
            <DetailRow
              label="مجوزها"
              value={
                parsePermissionCodes(detail.permission_codes)
                  .map((c) => PERMISSION_LABELS[c] || c)
                  .join('، ') || 'پیش‌فرض نقش'
              }
            />
            <DetailRow
              label="تاریخ ثبت"
              value={detail.created_at ? formatJalaliDateTime(detail.created_at) : '—'}
            />
          </div>
        )}
      </Modal>

      <Modal isOpen={!!permTarget} onClose={() => setPermTarget(null)} title="تنظیم مجوزها">
        {permTarget && (
          <div className="space-y-3">
            <p className="text-xs text-muted">
              مجوزهای «{displayName(permTarget)}» — نقش: {roleLabel(permTarget.role)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setCodes([...(ROLE_DEFAULTS[permTarget.role as StaffRole] || [])])}
              >
                اعمال پیش‌فرض نقش
              </button>
              <button
                type="button"
                className="text-xs text-muted hover:underline"
                onClick={() => setCodes([...ALL_PERMISSIONS])}
              >
                انتخاب همه
              </button>
              <button type="button" className="text-xs text-muted hover:underline" onClick={() => setCodes([])}>
                حذف همه
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {ALL_PERMISSIONS.map((code) => (
                <label
                  key={code}
                  className="flex items-center gap-2 text-sm text-ink p-2 rounded-lg hover:bg-surface-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={codes.includes(code)}
                    onChange={(e) =>
                      setCodes((prev) =>
                        e.target.checked ? [...prev, code] : prev.filter((c) => c !== code),
                      )
                    }
                    className="accent-primary"
                  />
                  {PERMISSION_LABELS[code] || code}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setPermTarget(null)} className="px-4 py-2 text-sm text-muted">
                انصراف
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSavePermissions}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره مجوزها'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="حذف کارمند"
        itemName={deleting ? displayName(deleting) : ''}
      />
    </div>
  );
};

export default EmployeesPage;
