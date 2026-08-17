import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import coursesService from '../../services/courses/coursesService';
import sportsService from '../../services/sports/sportsService';
import membersService from '../../services/members/membersService';
import type { Course, Sport, GymMember } from '../../types/api';
import { formatJalaliNumeric } from '../../utils/jalaliUtils';

export const CoursesPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('course.view');
  const { showToast } = useUI();
  const [items, setItems] = useState<Course[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sportId, setSportId] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
  const [enrollCustomer, setEnrollCustomer] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [members, setMembers] = useState<GymMember[]>([]);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sp, mem] = await Promise.all([
        coursesService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
        membersService.list(gymId).catch(() => [] as GymMember[]),
      ]);
      setItems(list);
      setSports(sp);
      setMembers(mem);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('course.view')) load();
  }, [hasGym, load, can]);

  const columns: Column<Course>[] = [
    { key: 'title', header: 'عنوان', render: (r) => <span className="text-ink font-medium">{r.title}</span> },
    { key: 'sport_name', header: 'رشته ورزشی', render: (r) => <span className="text-muted">{r.sport_name || sports.find(s => s.id === r.sport)?.name || 'نامشخص'}</span> },
    {
      key: 'start_date',
      header: 'شروع',
      render: (r) => <span className="text-muted text-xs">{formatJalaliNumeric(r.start_date)}</span>,
    },
    { key: 'capacity', header: 'ظرفیت', render: (r) => <span>{r.enrollment_count ?? 0}/{r.capacity ?? '—'}</span> },
    { key: 'price', header: 'قیمت', render: (r) => <span>{r.price?.toLocaleString('fa-IR') ?? '—'} تومان</span> },
    { key: 'status', header: 'وضعیت', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
  ];

  if (!hasGym) return <div className="space-y-6"><Header title="دوره‌ها" /><NoGymSelected /></div>;
  if (!can('course.view')) return <div className="space-y-6"><Header title="دوره‌ها" /><EmptyState title="دسترسی ندارید" /></div>;

  return (
    <div className="space-y-6">
      <Header
        title="دوره‌ها"
        onQuickAction={
          can('course.create')
            ? () => {
                setTitle('');
                setSportId('');
                setPrice('');
                setCapacity('');
                setStartDate('');
                setEndDate('');
                setOpen(true);
              }
            : undefined
        }
        quickActionLabel={can('course.create') ? 'دوره جدید' : undefined}
      />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="هنوز دوره‌ای ثبت نشده است" />}
      {!loading && !error && items.length > 0 && (
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['title']}
          actions={
            can('course.enroll')
              ? (r) => (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setEnrollCourse(r);
                      setEnrollCustomer('');
                    }}
                  >
                    ثبت‌نام
                  </button>
                )
              : undefined
          }
        />
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="دوره جدید">
        <div className="space-y-4">
          <FormField label="عنوان" required value={title} onChange={(e) => setTitle(e.target.value)} />
          {sports.length > 0 ? (
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">رشته ورزشی</label>
              <select
                className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
              >
                <option value="">انتخاب رشته</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-muted rounded-xl border border-border bg-surface p-3">
              فهرست رشته‌ها در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.
            </p>
          )}
          <JalaliDatePicker label="تاریخ شروع" value={startDate} onChange={setStartDate} />
          <JalaliDatePicker label="تاریخ پایان" value={endDate} onChange={setEndDate} />
          <FormField label="قیمت (تومان)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <FormField label="ظرفیت" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button
              type="button"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-primary-fg font-bold rounded-lg disabled:opacity-50"
              onClick={async () => {
                if (!gymId || !title.trim() || !sportId || !startDate || !endDate) {
                  showToast('عنوان، رشته، تاریخ شروع و پایان الزامی است.', 'warning');
                  return;
                }
                setSaving(true);
                try {
                  await coursesService.create(gymId, {
                    title,
                    sport: Number(sportId),
                    start_date: startDate,
                    end_date: endDate,
                    price: price ? Number(price) : 0,
                    capacity: capacity ? Number(capacity) : 0,
                    is_active: true,
                  });
                  showToast('دوره ثبت شد.', 'success');
                  setOpen(false);
                  load();
                } catch (e: unknown) {
                  showToast(e instanceof Error ? e.message : 'خطا', 'danger');
                } finally {
                  setSaving(false);
                }
              }}
            >
              ذخیره
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!enrollCourse} onClose={() => setEnrollCourse(null)} title={`ثبت‌نام در ${enrollCourse?.title || ''}`}>
        <div className="space-y-4">
          {members.length > 0 ? (
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">عضو</label>
              <select
                className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
                value={enrollCustomer}
                onChange={(e) => setEnrollCustomer(e.target.value)}
              >
                <option value="">انتخاب عضو</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}{m.phone ? ` — ${m.phone}` : ''}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-muted">عضوی برای انتخاب وجود ندارد.</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEnrollCourse(null)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button
              type="button"
              disabled={enrolling}
              className="px-4 py-2 text-sm bg-primary text-primary-fg font-bold rounded-lg disabled:opacity-50"
              onClick={async () => {
                if (!gymId || !enrollCourse || !enrollCustomer) return;
                setEnrolling(true);
                try {
                  await coursesService.enroll(gymId, enrollCourse.id, { customer: Number(enrollCustomer) });
                  showToast('ثبت‌نام انجام شد.', 'success');
                  setEnrollCourse(null);
                  load();
                } catch (e: unknown) {
                  showToast(e instanceof Error ? e.message : 'خطا', 'danger');
                } finally {
                  setEnrolling(false);
                }
              }}
            >
              ثبت‌نام
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
