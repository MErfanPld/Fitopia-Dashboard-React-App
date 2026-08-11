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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'); }
    finally { setLoading(false); }
  }, [gymId, section, can]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const money = (n: number) => n.toLocaleString('fa-IR') + ' \u062a\u0648\u0645\u0627\u0646';
  const titles: Record<string, string> = { report: '\u06af\u0632\u0627\u0631\u0634 \u0645\u0627\u0644\u06cc', transactions: '\u062a\u0631\u0627\u06a9\u0646\u0634\u200c\u0647\u0627', payments: '\u067e\u0631\u062f\u0627\u062e\u062a\u200c\u0647\u0627', refunds: '\u0627\u0633\u062a\u0631\u062f\u0627\u062f' };

  if (!hasGym) return <div className="space-y-6"><Header title={titles[section]} /><NoGymSelected /></div>;

  const txCols: Column<FinanceTransaction>[] = [
    { key: 'date', header: '\u062a\u0627\u0631\u06cc\u062e', render: (r) => <span className="text-slate-300 text-xs">{r.date}</span> },
    { key: 'type', header: '\u0646\u0648\u0639', render: (r) => <span className={r.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>{r.type === 'income' ? '\u062f\u0631\u0622\u0645\u062f' : '\u0647\u0632\u06cc\u0646\u0647'}</span> },
    { key: 'category', header: '\u062f\u0633\u062a\u0647', render: (r) => <span className="text-slate-300">{r.category || '\u2014'}</span> },
    { key: 'amount', header: '\u0645\u0628\u0644\u063a', render: (r) => <span className="text-white font-medium">{money(r.amount)}</span> },
    { key: 'status', header: '\u0648\u0636\u0639\u06cc\u062a', render: (r) => <span className="text-xs text-slate-400">{r.status}</span> },
  ];
  const payCols: Column<CustomerPayment>[] = [
    { key: 'customer', header: '\u0645\u0634\u062a\u0631\u06cc', render: (r) => <span className="text-white">{r.customer}</span> },
    { key: 'total_price', header: '\u0645\u0628\u0644\u063a \u06a9\u0644', render: (r) => <span>{money(r.total_price)}</span> },
    { key: 'amount_paid', header: '\u067e\u0631\u062f\u0627\u062e\u062a\u200c\u0634\u062f\u0647', render: (r) => <span className="text-emerald-400">{money(r.amount_paid)}</span> },
    { key: 'remaining_balance', header: '\u0645\u0627\u0646\u062f\u0647', render: (r) => <span className="text-amber-400">{money(r.remaining_balance || 0)}</span> },
  ];

  return (
    <div className="space-y-6">
      <Header
        title={titles[section]}
        subtitle="\u062f\u0627\u062f\u0647\u200c\u0647\u0627\u06cc \u0645\u0627\u0644\u06cc \u0648\u0627\u0642\u0639\u06cc \u0628\u0627\u0634\u06af\u0627\u0647"
        onQuickAction={section === 'refunds' && can('finance.refund') ? () => setRefundOpen(true) : undefined}
        quickActionLabel={section === 'refunds' && can('finance.refund') ? '\u0627\u0633\u062a\u0631\u062f\u0627\u062f \u062c\u062f\u06cc\u062f' : undefined}
      />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && section === 'report' && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="\u062f\u0631\u0622\u0645\u062f \u0645\u0627\u0647" value={money(report.monthly.income)} icon={TrendingUp} accentColor="emerald" />
            <StatCard title="\u0647\u0632\u06cc\u0646\u0647 \u0645\u0627\u0647" value={money(report.monthly.expense)} icon={TrendingDown} accentColor="orange" />
            <StatCard title="\u062e\u0627\u0644\u0635 \u0645\u0627\u0647" value={money(report.monthly.net)} icon={Wallet} accentColor="blue" />
          </div>
          {report.outstanding_balances?.length > 0 && (
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">\u0645\u0627\u0646\u062f\u0647\u200c\u0647\u0627\u06cc \u0645\u0639\u0648\u0642</h3>
              <ul className="space-y-2">
                {report.outstanding_balances.map((d) => (
                  <li key={d.payment_id} className="flex justify-between text-sm text-slate-300">
                    <span>{d.customer_name}</span>
                    <span className="text-amber-400">{money(d.remaining)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {!loading && !error && section === 'transactions' && (txs.length === 0 ? <EmptyState title="\u062a\u0631\u0627\u06a9\u0646\u0634\u06cc \u0646\u06cc\u0633\u062a" /> : <DataTable columns={txCols} data={txs} />)}
      {!loading && !error && (section === 'payments' || section === 'refunds') && (payments.length === 0 ? <EmptyState title="\u067e\u0631\u062f\u0627\u062e\u062a\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647" /> : <DataTable columns={payCols} data={payments} />)}
      {!loading && !error && section === 'report' && !report && !can('finance.report') && <EmptyState title="\u062f\u0633\u062a\u0631\u0633\u06cc \u0628\u0647 \u06af\u0632\u0627\u0631\u0634 \u0645\u0627\u0644\u06cc \u0646\u062f\u0627\u0631\u06cc\u062f" />}
      <Modal isOpen={refundOpen} onClose={() => setRefundOpen(false)} title="\u062b\u0628\u062a \u0627\u0633\u062a\u0631\u062f\u0627\u062f">
        <div className="space-y-4">
          <FormField label="\u0634\u0646\u0627\u0633\u0647 \u062a\u0631\u0627\u06a9\u0646\u0634" type="number" required value={refundTx} onChange={(e) => setRefundTx(e.target.value)} />
          <FormField label="\u0645\u0628\u0644\u063a" type="number" required value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          <FormField label="\u062f\u0644\u06cc\u0644" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRefundOpen(false)} className="px-4 py-2 text-sm text-slate-300">\u0627\u0646\u0635\u0631\u0627\u0641</button>
            <button type="button" disabled={saving} className="px-4 py-2 text-sm bg-[#FF7A1A] text-white rounded-lg" onClick={async () => {
              if (!gymId || !refundTx || !refundAmount) return;
              setSaving(true);
              try {
                await financeService.createRefund(gymId, { original_transaction: Number(refundTx), amount: Number(refundAmount), reason: refundReason });
                showToast('\u0627\u0633\u062a\u0631\u062f\u0627\u062f \u062b\u0628\u062a \u0634\u062f', 'success'); setRefundOpen(false); load();
              } catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger'); }
              finally { setSaving(false); }
            }}>\u062a\u0627\u06cc\u06cc\u062f \u0627\u0633\u062a\u0631\u062f\u0627\u062f</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
