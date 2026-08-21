import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Plus, RefreshCw } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import financeService from '../../services/finance/financeService';
import membersService from '../../services/members/membersService';
import type { CustomerPayment, FinanceReport, FinanceTransaction, GymMember } from '../../types/api';
import { formatJalaliDate, formatJalaliDateTime } from '../../utils/jalaliUtils';

type Section = 'report' | 'transactions' | 'payments' | 'refunds';

const TYPE_LABELS: Record<string, string> = { income: 'درآمد', expense: 'هزینه' };
const CATEGORY_LABELS: Record<string, string> = {
  membership: 'عضویت', course: 'دوره', single_session: 'جلسه تکی', other_income: 'سایر درآمد',
  rent: 'اجاره', utilities: 'قبوض', equipment: 'تجهیزات', salary: 'حقوق',
  coach_payment: 'پرداخت مربی', maintenance: 'نگهداری', marketing: 'بازاریابی', other_expense: 'سایر هزینه',
};
const METHOD_LABELS: Record<string, string> = {
  cash: 'نقد', card: 'کارت', transfer: 'کارت به کارت', online: 'آنلاین', other: 'سایر',
};
const STATUS_LABELS: Record<string, string> = {
  completed: 'تکمیل', pending: 'در انتظار', cancelled: 'لغو', refunded: 'مسترد',
};
const INCOME_CATS = ['membership', 'course', 'single_session', 'other_income'];
const EXPENSE_CATS = ['rent', 'utilities', 'equipment', 'salary', 'coach_payment', 'maintenance', 'marketing', 'other_expense'];

function money(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}
function todayIso() { return new Date().toISOString().slice(0, 10); }
function sectionFromPath(path: string): Section {
  if (path.includes('/transactions')) return 'transactions';
  if (path.includes('/payments')) return 'payments';
  if (path.includes('/refunds')) return 'refunds';
  return 'report';
}
const TABS: { key: Section; path: string; label: string }[] = [
  { key: 'report', path: '/finance/reports', label: 'گزارش' },
  { key: 'transactions', path: '/finance/transactions', label: 'تراکنش‌ها' },
  { key: 'payments', path: '/finance/payments', label: 'پرداخت‌ها' },
  { key: 'refunds', path: '/finance/refunds', label: 'استرداد' },
];

export const FinancePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const section = sectionFromPath(location.pathname);
  const { gymId, hasGym, can } = useGymScoped('finance.view');
  const { showToast } = useUI();

  const [txs, setTxs] = useState<FinanceTransaction[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [txOpen, setTxOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('membership');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(todayIso());
  const [txDesc, setTxDesc] = useState('');
  const [txMethod, setTxMethod] = useState('cash');
  const [txRef, setTxRef] = useState('');
  const [txCustomer, setTxCustomer] = useState('');
  const [payCustomer, setPayCustomer] = useState('');
  const [payTotal, setPayTotal] = useState('');
  const [payPaid, setPayPaid] = useState('');
  const [payDiscount, setPayDiscount] = useState('0');
  const [payDesc, setPayDesc] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payRef, setPayRef] = useState('');
  const [refundTx, setRefundTx] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const memberName = useMemo(() => {
    const m = new Map<number, string>();
    members.forEach((x) => m.set(x.id, x.full_name));
    return m;
  }, [members]);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try {
      const tasks: Promise<void>[] = [
        membersService.list(gymId).then((m) => setMembers(m || [])).catch(() => setMembers([])),
      ];
      if (section === 'report' && can('finance.report')) tasks.push(financeService.report(gymId).then(setReport));
      if (section === 'transactions' || section === 'refunds') tasks.push(financeService.listTransactions(gymId).then((t) => setTxs(t || [])));
      if (section === 'payments') tasks.push(financeService.listPayments(gymId).then((p) => setPayments(p || [])));
      await Promise.all(tasks);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در بارگذاری مالی');
    } finally { setLoading(false); }
  }, [gymId, section, can]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);
  useEffect(() => {
    const cats = txType === 'income' ? INCOME_CATS : EXPENSE_CATS;
    if (!cats.includes(txCategory)) setTxCategory(cats[0]);
  }, [txType, txCategory]);

  const incomeTxOptions = useMemo(() => txs
    .filter((t) => t.type === 'income' && t.status !== 'refunded' && t.status !== 'cancelled')
    .map((t) => ({
      value: String(t.id),
      label: `${TYPE_LABELS[t.type || ''] || t.type} · ${CATEGORY_LABELS[t.category || ''] || t.category} · ${money(t.amount)}${t.description ? ` — ${t.description}` : ''}`,
    })), [txs]);

  const filteredTxs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return txs;
    return txs.filter((t) => [TYPE_LABELS[t.type || ''], CATEGORY_LABELS[t.category || ''], t.description, METHOD_LABELS[t.payment_method || ''], STATUS_LABELS[t.status || ''], t.customer != null ? memberName.get(t.customer) : ''].join(' ').toLowerCase().includes(q));
  }, [txs, search, memberName]);

  const filteredPays = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => [memberName.get(p.customer), p.description, METHOD_LABELS[p.payment_method || '']].join(' ').toLowerCase().includes(q));
  }, [payments, search, memberName]);

  const openTx = () => { setTxType('income'); setTxCategory('membership'); setTxAmount(''); setTxDate(todayIso()); setTxDesc(''); setTxMethod('cash'); setTxRef(''); setTxCustomer(''); setTxOpen(true); };
  const openPay = () => { setPayCustomer(''); setPayTotal(''); setPayPaid(''); setPayDiscount('0'); setPayDesc(''); setPayMethod('cash'); setPayRef(''); setPayOpen(true); };
  const openRefund = async () => {
    setRefundTx(''); setRefundAmount(''); setRefundReason(''); setRefundOpen(true);
    if (gymId && txs.length === 0) { try { setTxs(await financeService.listTransactions(gymId)); } catch { /* */ } }
  };

  const submitTx = async () => {
    if (!gymId) return;
    if (!txAmount || Number(txAmount) < 1) { showToast('مبلغ نامعتبر است', 'warning'); return; }
    if (!txDate) { showToast('تاریخ الزامی است', 'warning'); return; }
    setSaving(true);
    try {
      await financeService.createTransaction(gymId, { type: txType, category: txCategory, amount: Number(txAmount), date: txDate, description: txDesc, payment_method: txMethod, reference_number: txRef, customer: txCustomer ? Number(txCustomer) : null, status: 'completed' });
      showToast('تراکنش ثبت شد', 'success'); setTxOpen(false); load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'خطا', 'danger'); }
    finally { setSaving(false); }
  };

  const submitPay = async () => {
    if (!gymId) return;
    if (!payCustomer) { showToast('عضو را انتخاب کنید', 'warning'); return; }
    const total = Number(payTotal); const paid = Number(payPaid); const disc = Number(payDiscount) || 0;
    if (Number.isNaN(total) || total < 0 || Number.isNaN(paid) || paid < 0) { showToast('مبالغ نامعتبر است', 'warning'); return; }
    setSaving(true);
    try {
      await financeService.createPayment(gymId, { customer: Number(payCustomer), total_price: total, amount_paid: paid, discount: disc, description: payDesc, payment_method: payMethod, reference_number: payRef });
      showToast('پرداخت ثبت شد', 'success'); setPayOpen(false); load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'خطا', 'danger'); }
    finally { setSaving(false); }
  };

  const submitRefund = async () => {
    if (!gymId) return;
    if (!refundTx) { showToast('تراکنش را انتخاب کنید', 'warning'); return; }
    if (!refundAmount || Number(refundAmount) < 1) { showToast('مبلغ نامعتبر است', 'warning'); return; }
    setSaving(true);
    try {
      await financeService.createRefund(gymId, { original_transaction: Number(refundTx), amount: Number(refundAmount), reason: refundReason });
      showToast('استرداد ثبت شد', 'success'); setRefundOpen(false); load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'خطا', 'danger'); }
    finally { setSaving(false); }
  };

  const txCols: Column<FinanceTransaction>[] = [
    { key: 'type', header: 'نوع', render: (r) => <span className={r.type === 'income' ? 'text-success-text' : 'text-danger-text'}>{TYPE_LABELS[r.type || ''] || r.type}</span> },
    { key: 'category', header: 'دسته', render: (r) => <span className="text-sm text-muted">{CATEGORY_LABELS[r.category || ''] || r.category || '—'}</span> },
    { key: 'amount', header: 'مبلغ', render: (r) => <span className="tabular-nums font-medium text-ink">{money(r.amount)}</span> },
    { key: 'customer', header: 'عضو', render: (r) => <span className="text-sm text-muted">{r.customer != null ? memberName.get(r.customer) || '—' : '—'}</span> },
    { key: 'payment_method', header: 'روش', render: (r) => <span className="text-xs text-secondary">{METHOD_LABELS[r.payment_method || ''] || r.payment_method || '—'}</span> },
    { key: 'status', header: 'وضعیت', render: (r) => <span className="text-xs text-muted">{STATUS_LABELS[r.status || ''] || r.status || '—'}</span> },
    { key: 'date', header: 'تاریخ', render: (r) => <span className="text-xs text-muted tabular-nums">{r.date ? formatJalaliDate(r.date) : r.created_at ? formatJalaliDateTime(r.created_at) : '—'}</span> },
    { key: 'description', header: 'توضیح', render: (r) => <span className="text-xs text-muted truncate max-w-[140px] block">{r.description || '—'}</span> },
  ];

  const payCols: Column<CustomerPayment>[] = [
    { key: 'customer', header: 'عضو', render: (r) => <span className="font-medium text-ink">{memberName.get(r.customer) || '—'}</span> },
    { key: 'total_price', header: 'مبلغ کل', render: (r) => <span className="tabular-nums">{money(r.total_price)}</span> },
    { key: 'amount_paid', header: 'پرداخت‌شده', render: (r) => <span className="tabular-nums text-success-text">{money(r.amount_paid)}</span> },
    { key: 'discount', header: 'تخفیف', render: (r) => <span className="tabular-nums text-muted">{money(r.discount || 0)}</span> },
    { key: 'remaining_balance', header: 'مانده', render: (r) => <span className={`tabular-nums ${(r.remaining_balance || 0) > 0 ? 'text-warning-text' : 'text-muted'}`}>{money(r.remaining_balance || 0)}</span> },
    { key: 'payment_method', header: 'روش', render: (r) => <span className="text-xs">{METHOD_LABELS[r.payment_method || ''] || r.payment_method || '—'}</span> },
    { key: 'created_at', header: 'تاریخ', render: (r) => <span className="text-xs text-muted tabular-nums">{r.created_at ? formatJalaliDateTime(r.created_at) : '—'}</span> },
  ];

  if (!hasGym) return <NoGymSelected />;
  if (!can('finance.view') && !can('finance.create') && !can('finance.report')) {
    return <div className="space-y-4"><Header title="مالی" /><ErrorBlock message="دسترسی به بخش مالی ندارید." /></div>;
  }

  const titles: Record<Section, string> = { report: 'گزارش مالی', transactions: 'تراکنش‌ها', payments: 'پرداخت‌ها', refunds: 'استرداد' };

  return (
    <div className="space-y-4">
      <Header title={titles[section]} subtitle="مدیریت مالی باشگاه" actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> بروزرسانی
          </button>
          {section === 'transactions' && can('finance.create') && (
            <button type="button" onClick={openTx} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> تراکنش جدید</button>
          )}
          {section === 'payments' && can('finance.create') && (
            <button type="button" onClick={openPay} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> پرداخت جدید</button>
          )}
          {section === 'refunds' && can('finance.refund') && (
            <button type="button" onClick={openRefund} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> استرداد جدید</button>
          )}
        </div>
      } />

      <div className="flex gap-1 p-1 rounded-xl bg-surface-elevated border border-border overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => navigate(t.path)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg whitespace-nowrap transition-colors ${
              section === t.key ? 'bg-primary text-primary-fg font-semibold' : 'text-muted hover:text-ink hover:bg-surface-hover'
            }`}>{t.label}</button>
        ))}
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && <LoadingBlock />}

      {!loading && !error && section === 'report' && (
        can('finance.report') && report ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard title="درآمد امروز" value={money(report.daily.income)} icon={TrendingUp} accent="success" />
              <StatCard title="هزینه امروز" value={money(report.daily.expense)} icon={TrendingDown} accent="danger" />
              <StatCard title="خالص امروز" value={money(report.daily.net)} icon={Wallet} accent="primary" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard title="درآمد ماه" value={money(report.monthly.income)} icon={TrendingUp} accent="success" />
              <StatCard title="هزینه ماه" value={money(report.monthly.expense)} icon={TrendingDown} accent="warning" />
              <StatCard title="خالص ماه" value={money(report.monthly.net)} icon={Wallet} accent="info" />
            </div>
            {!!report.income_by_category?.length && (
              <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">درآمد به تفکیک دسته</h3>
                <ul className="space-y-2">{report.income_by_category.map((c) => (
                  <li key={c.category} className="flex justify-between text-sm">
                    <span className="text-muted">{CATEGORY_LABELS[c.category] || c.category}</span>
                    <span className="tabular-nums text-ink font-medium">{money(c.total)}</span>
                  </li>
                ))}</ul>
              </div>
            )}
            {!!report.outstanding_balances?.length && (
              <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">مانده‌های معوق</h3>
                <ul className="space-y-2">{report.outstanding_balances.map((d) => (
                  <li key={d.payment_id} className="flex justify-between text-sm">
                    <span className="text-muted">{d.customer_name}</span>
                    <span className="tabular-nums text-warning-text font-medium">{money(d.remaining)}</span>
                  </li>
                ))}</ul>
              </div>
            )}
          </>
        ) : <EmptyState title="دسترسی به گزارش ندارید یا داده‌ای نیست" />
      )}

      {!loading && !error && section === 'transactions' && (
        <>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو..." className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink" />
          {filteredTxs.length === 0 ? (
            <EmptyState title="تراکنشی ثبت نشده" action={can('finance.create') ? <button type="button" onClick={openTx} className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">تراکنش جدید</button> : undefined} />
          ) : <DataTable columns={txCols} data={filteredTxs} rowKey={(r) => r.id} />}
        </>
      )}

      {!loading && !error && section === 'payments' && (
        <>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو عضو یا توضیح..." className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink" />
          {filteredPays.length === 0 ? (
            <EmptyState title="پرداختی ثبت نشده" action={can('finance.create') ? <button type="button" onClick={openPay} className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">پرداخت جدید</button> : undefined} />
          ) : <DataTable columns={payCols} data={filteredPays} rowKey={(r) => r.id} />}
        </>
      )}

      {!loading && !error && section === 'refunds' && (
        <div className="space-y-3">
          <p className="text-sm text-muted">استرداد روی تراکنش‌های درآمدی ثبت می‌شود. لیست جداگانه‌ای در API نیست.</p>
          {can('finance.refund') && (
            <button type="button" onClick={openRefund} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> ثبت استرداد</button>
          )}
          {txs.filter((t) => t.status === 'refunded').length === 0 ? <EmptyState title="هنوز استردادی ثبت نشده" /> : (
            <DataTable columns={txCols} data={txs.filter((t) => t.status === 'refunded')} rowKey={(r) => r.id} />
          )}
        </div>
      )}

      <Modal isOpen={txOpen} onClose={() => setTxOpen(false)} title="ثبت تراکنش">
        <div className="space-y-3">
          <FormField label="نوع" required isSelect value={txType} options={[{ value: 'income', label: 'درآمد' }, { value: 'expense', label: 'هزینه' }]} onChange={(e) => setTxType(e.target.value as 'income' | 'expense')} />
          <FormField label="دسته" required isSelect value={txCategory} options={(txType === 'income' ? INCOME_CATS : EXPENSE_CATS).map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c }))} onChange={(e) => setTxCategory(e.target.value)} />
          <FormField label="مبلغ (تومان)" required type="number" min={1} value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
          <JalaliDatePicker label="تاریخ" required value={txDate} onChange={setTxDate} />
          <FormField label="روش پرداخت" isSelect value={txMethod} options={Object.entries(METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))} onChange={(e) => setTxMethod(e.target.value)} />
          <FormField label="عضو (اختیاری)" isSelect value={txCustomer} options={[{ value: '', label: '—' }, ...members.map((m) => ({ value: String(m.id), label: m.full_name }))]} onChange={(e) => setTxCustomer(e.target.value)} />
          <FormField label="شماره پیگیری" value={txRef} onChange={(e) => setTxRef(e.target.value)} />
          <FormField label="توضیحات" isTextarea value={txDesc} onChange={(e) => setTxDesc(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setTxOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={submitTx} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'ثبت'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={payOpen} onClose={() => setPayOpen(false)} title="ثبت پرداخت عضو">
        <div className="space-y-3">
          <FormField label="عضو" required isSelect value={payCustomer} options={[{ value: '', label: members.length ? 'انتخاب عضو' : 'عضوی نیست' }, ...members.map((m) => ({ value: String(m.id), label: `${m.full_name}${m.phone ? ` — ${m.phone}` : ''}` }))]} onChange={(e) => setPayCustomer(e.target.value)} />
          <FormField label="مبلغ کل (تومان)" required type="number" min={0} value={payTotal} onChange={(e) => setPayTotal(e.target.value)} />
          <FormField label="مبلغ پرداخت‌شده" required type="number" min={0} value={payPaid} onChange={(e) => setPayPaid(e.target.value)} />
          <FormField label="تخفیف" type="number" min={0} value={payDiscount} onChange={(e) => setPayDiscount(e.target.value)} />
          <FormField label="روش پرداخت" isSelect value={payMethod} options={Object.entries(METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))} onChange={(e) => setPayMethod(e.target.value)} />
          <FormField label="شماره پیگیری" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
          <FormField label="توضیحات" isTextarea value={payDesc} onChange={(e) => setPayDesc(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPayOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={submitPay} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'ثبت'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={refundOpen} onClose={() => setRefundOpen(false)} title="ثبت استرداد">
        <div className="space-y-3">
          <FormField label="تراکنش درآمدی" required isSelect value={refundTx} options={[{ value: '', label: incomeTxOptions.length ? 'انتخاب تراکنش' : 'تراکنش درآمدی موجود نیست' }, ...incomeTxOptions]} onChange={(e) => setRefundTx(e.target.value)} />
          <FormField label="مبلغ استرداد (تومان)" required type="number" min={1} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          <FormField label="دلیل" isTextarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRefundOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={submitRefund} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'تایید استرداد'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FinancePage;
