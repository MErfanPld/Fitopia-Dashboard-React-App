import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import financeService from '../../services/finance/financeService';
import type { CustomerPayment, FinanceReport, FinanceTransaction } from '../../types/api';

export const FinancePage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped();
  const { showToast } = useUI();
  const location = useLocation();
  const section = location.pathname.includes('transactions') ? 'transactions'
    : location.pathname.includes('payments') ? 'payments'
    : location.pathname.includes('refunds') ? 'refunds' : 'report';

  const [report, setReport] = useState<FinanceReport | null>(null);
  const [txs, setTxs] = useState<FinanceTransaction[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundTx, setRefundTx] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try {
      if (section === 'report' && can('finance.report')) setReport(await financeService.report(gymId));
      else if (section === 'transactions' && can('finance.view')) setTxs(await financeService.listTransactions(gymId));
      else if ((section === 'payments' || section === 'refunds') && can('finance.view')) setPayments(await financeService.listPayments(gymId));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'دریافت اطلاعات با خطا مواجه شد.'); }
    finally { setLoading(false); }
  }, [gymId, section, can]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const money = (n: number) => n.toLocaleString('fa-IR') + ' تومان';
  const titles: Record<string, string> = { report: 'گزارش مالی', transactions: 'تراکنش‌ها', payments: 'پرداخت‌ها', refunds: 'استرداد' };

  if (!hasGym) return <div className="space-y-6"><Header title={titles[section]} /><NoGymSelected /></div>;

  const txCols: Column<FinanceTransaction>[] = [
    { key: 'date', header: 'تاریخ', render: (r) => <span className="text-muted text-xs">{r.date}</span> },
    { key: 'type', header: 'نوع', render: (r) => <span className={r.type === 'income' ? 'text-success-text' : 'text-danger-text'}>{r.type === 'income' ? 'درآمد' : 'هزینه'}</span> },
    { key: 'category', header: 'دسته', render: (r) => <span className="text-muted">{r.category || '—'}</span> },
    { key: 'amount', header: 'مبلغ', render: (r) => <span className="text-ink font-medium">{money(r.amount)}</span> },
    { key: 'status', header: 'وضعیت', render: (r) => <span className="text-xs text-muted">{r.status}</span> },
  ];
  const payCols: Column<CustomerPayment>[] = [
    { key: 'customer', header: 'عضو', render: (r) => <span className="text-ink">{r.customer}</span> },
    { key: 'total_price', header: 'مبلغ کل', render: (r) => <span>{money(r.total_price)}</span> },
    { key: 'amount_paid', header: 'پرداخت‌شده', render: (r) => <span className="text-success-text">{money(r.amount_paid)}</span> },
    { key: 'remaining_balance', header: 'مانده', render: (r) => <span className="text-warning-text">{money(r.remaining_balance || 0)}</span> },
  ];

  return (
    <div className="space-y-6">
      <Header
        title={titles[section]}
        subtitle="گزارش و تراکنش‌های مالی"
        onQuickAction={section === 'refunds' && can('finance.refund') ? () => setRefundOpen(true) : undefined}
        quickActionLabel={section === 'refunds' && can('finance.refund') ? 'استرداد جدید' : undefined}
      />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && section === 'report' && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="درآمد ماه" value={money(report.monthly.income)} icon={TrendingUp} accentColor="emerald" />
            <StatCard title="هزینه ماه" value={money(report.monthly.expense)} icon={TrendingDown} accentColor="orange" />
            <StatCard title="خالص ماه" value={money(report.monthly.net)} icon={Wallet} accentColor="blue" />
          </div>
          {report.outstanding_balances?.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">مانده‌های معوق</h3>
              <ul className="space-y-2">
                {report.outstanding_balances.map((d) => (
                  <li key={d.payment_id} className="flex justify-between text-sm text-muted">
                    <span>{d.customer_name}</span>
                    <span className="text-warning-text">{money(d.remaining)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {!loading && !error && section === 'transactions' && (txs.length === 0 ? <EmptyState title="تراکنشی نیست" /> : <DataTable columns={txCols} data={txs} />)}
      {!loading && !error && (section === 'payments' || section === 'refunds') && (payments.length === 0 ? <EmptyState title="پرداختی ثبت نشده" /> : <DataTable columns={payCols} data={payments} />)}
      {!loading && !error && section === 'report' && !report && !can('finance.report') && <EmptyState title="دسترسی به گزارش مالی ندارید" />}
      <Modal isOpen={refundOpen} onClose={() => setRefundOpen(false)} title="ثبت استرداد">
        <div className="space-y-4">
          <FormField label="شماره تراکنش" type="number" required value={refundTx} onChange={(e) => setRefundTx(e.target.value)} />
          <FormField label="مبلغ" type="number" required value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          <FormField label="دلیل" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRefundOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-primary text-[#0B0B0F] font-bold rounded-lg" onClick={async () => {
              if (!gymId || !refundTx || !refundAmount) return;
              setSaving(true);
              try {
                await financeService.createRefund(gymId, { original_transaction: Number(refundTx), amount: Number(refundAmount), reason: refundReason });
                showToast('استرداد ثبت شد', 'success'); setRefundOpen(false); load();
              } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'خطا', 'danger'); }
              finally { setSaving(false); }
            }}>تایید استرداد</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
