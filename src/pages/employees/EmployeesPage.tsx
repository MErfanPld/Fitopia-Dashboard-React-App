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
      setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.');
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
      showToast('\u0634\u0646\u0627\u0633\u0647 \u06a9\u0627\u0631\u0628\u0631 (user) \u0627\u0644\u0632\u0627\u0645\u06cc \u0627\u0633\u062a. \u06a9\u0627\u0631\u0645\u0646\u062f \u0628\u0627\u06cc\u062f \u06a9\u0627\u0631\u0628\u0631 \u0645\u0648\u062c\u0648\u062f \u062f\u0631 \u0633\u06cc\u0633\u062a\u0645 \u0628\u0627\u0634\u062f.', 'warning');
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
        showToast('\u06a9\u0627\u0631\u0645\u0646\u062f \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc \u0634\u062f.', 'success');
      } else {
        await employeesService.create(gymId, {
          user: Number(userId),
          role,
          employee_number: employeeNumber || undefined,
          is_active: isActive,
        });
        showToast('\u06a9\u0627\u0631\u0645\u0646\u062f \u062b\u0628\u062a \u0634\u062f.', 'success');
      }
      setFormOpen(false);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627 \u062f\u0631 \u0630\u062e\u06cc\u0631\u0647', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<StaffEmployee>[] = [
    { key: 'username', header: '\u06a9\u0627\u0631\u0628\u0631', render: (r) => <span className="text-white">{r.username || r.user}</span> },
    { key: 'user_phone', header: '\u062a\u0644\u0641\u0646', render: (r) => <span className="text-slate-300">{r.user_phone || '\u2014'}</span> },
    {
      key: 'role',
      header: '\u0646\u0642\u0634',
      render: (r) => <span className="text-slate-200">{ROLE_LABELS[r.role as StaffRole] || r.role}</span>,
    },
    {
      key: 'is_active',
      header: '\u0648\u0636\u0639\u06cc\u062a',
      render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} />,
    },
  ];

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="\u06a9\u0627\u0631\u06a9\u0646\u0627\u0646" />
        <NoGymSelected />
      </div>
    );
  }
  if (!can('employee.view')) {
    return (
      <div className="space-y-6">
        <Header title="\u06a9\u0627\u0631\u06a9\u0646\u0627\u0646" />
        <EmptyState title="\u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u062f\u0627\u0631\u06cc\u062f" description="\u0645\u062c\u0648\u0632 \u0645\u0634\u0627\u0647\u062f\u0647 \u06a9\u0627\u0631\u06a9\u0646\u0627\u0646 \u0628\u0631\u0627\u06cc \u0646\u0642\u0634 \u0634\u0645\u0627 \u0641\u0639\u0627\u0644 \u0646\u06cc\u0633\u062a." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="\u06a9\u0627\u0631\u06a9\u0646\u0627\u0646"
        subtitle="\u06a9\u0627\u0631\u0645\u0646\u062f\u0627\u0646 \u0648 \u062f\u0633\u062a\u0631\u0633\u06cc\u200c\u0647\u0627\u06cc \u0628\u0627\u0634\u06af\u0627\u0647 \u2014 \u0627\u06cc\u062c\u0627\u062f \u06a9\u0627\u0631\u0645\u0646\u062f \u0646\u06cc\u0627\u0632\u0645\u0646\u062f \u0634\u0646\u0627\u0633\u0647 \u06a9\u0627\u0631\u0628\u0631 \u0645\u0648\u062c\u0648\u062f \u062f\u0631 \u0633\u06cc\u0633\u062a\u0645 \u0627\u0633\u062a"
        onQuickAction={can('employee.manage') ? openCreate : undefined}
        quickActionLabel={can('employee.manage') ? '\u06a9\u0627\u0631\u0645\u0646\u062f \u062c\u062f\u06cc\u062f' : undefined}
      />
      <div className="flex justify-end">
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#2A2A2A] rounded-lg text-slate-300">
          <RefreshCw className="w-4 h-4" />
          \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc
        </button>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="\u06a9\u0627\u0631\u0645\u0646\u062f\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647" description="\u0628\u0631\u0627\u06cc \u0627\u0641\u0632\u0648\u062f\u0646 \u06a9\u0627\u0631\u0645\u0646\u062f\u060c \u0634\u0646\u0627\u0633\u0647 \u06a9\u0627\u0631\u0628\u0631 \u0645\u0648\u062c\u0648\u062f \u062f\u0631 \u0633\u06cc\u0633\u062a\u0645 \u0641\u06cc\u062a\u0648\u067e\u06cc\u0627 \u0644\u0627\u0632\u0645 \u0627\u0633\u062a." />
      )}
      {!loading && !error && items.length > 0 && (
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['username', 'user_phone']}
          actions={(r) =>
            can('employee.manage') ? (
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 text-slate-400 hover:text-[#FF9D4D]" title="\u0648\u06cc\u0631\u0627\u06cc\u0634" onClick={() => openEdit(r)}>
                  <Edit3 className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 text-slate-400 hover:text-[#FF9D4D]" title="\u0645\u062c\u0648\u0632\u0647\u0627" onClick={() => { setPermTarget(r); setCodes((r.permission_codes || []) as PermissionCode[]); }}>
                  <Shield className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 text-slate-400 hover:text-red-400" title="\u062d\u0630\u0641" onClick={() => setDeleting(r)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null
          }
        />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? '\u0648\u06cc\u0631\u0627\u06cc\u0634 \u06a9\u0627\u0631\u0645\u0646\u062f' : '\u06a9\u0627\u0631\u0645\u0646\u062f \u062c\u062f\u06cc\u062f'}>
        <div className="space-y-4">
          {!editing && (
            <FormField label="\u0634\u0646\u0627\u0633\u0647 \u06a9\u0627\u0631\u0628\u0631 (user id)" type="number" required value={userId} onChange={(e) => setUserId(e.target.value)} helpText="\u0628\u0627\u06cc\u062f \u06a9\u0627\u0631\u0628\u0631 \u0645\u0648\u062c\u0648\u062f \u062f\u0631 \u0633\u06cc\u0633\u062a\u0645 \u0628\u0627\u0634\u062f." />
          )}
          <FormField label="\u0646\u0642\u0634" isSelect value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTIONS} />
          <FormField label="\u06a9\u062f \u067e\u0631\u0633\u0646\u0644\u06cc" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-[#333]" />
            \u0641\u0639\u0627\u0644
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-slate-300">\u0627\u0646\u0635\u0631\u0627\u0641</button>
            <button type="button" disabled={saving} onClick={save} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg disabled:opacity-50">{saving ? '...' : '\u0630\u062e\u06cc\u0631\u0647'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!permTarget} onClose={() => setPermTarget(null)} title="\u062a\u0646\u0638\u06cc\u0645 \u0645\u062c\u0648\u0632\u0647\u0627">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {ALL_PERMISSIONS.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={codes.includes(code)} onChange={(e) => { setCodes((prev) => (e.target.checked ? [...prev, code] : prev.filter((c) => c !== code))); }} className="rounded border-[#333]" />
              {PERMISSION_LABELS[code]}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={() => setPermTarget(null)} className="px-4 py-2 text-sm text-slate-300">\u0627\u0646\u0635\u0631\u0627\u0641</button>
          <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg" onClick={async () => {
            if (!gymId || !permTarget) return;
            setSaving(true);
            try {
              await employeesService.setPermissions(gymId, permTarget.id, codes);
              showToast('\u0645\u062c\u0648\u0632\u0647\u0627 \u0630\u062e\u06cc\u0631\u0647 \u0634\u062f', 'success');
              setPermTarget(null);
              load();
            } catch (e: unknown) {
              showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger');
            } finally {
              setSaving(false);
            }
          }}>\u0630\u062e\u06cc\u0631\u0647</button>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} itemName={deleting?.username || String(deleting?.user || '')} onConfirm={async () => {
        if (!gymId || !deleting) return;
        try {
          await employeesService.remove(gymId, deleting.id);
          showToast('\u062d\u0630\u0641 \u0634\u062f', 'success');
          setDeleting(null);
          load();
        } catch (e: unknown) {
          showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger');
        }
      }} />
    </div>
  );
};
