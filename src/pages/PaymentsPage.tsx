import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { StatCard } from '../components/common/StatCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Payment, PaymentStatus } from '../types';
import { CreditCard, Wallet, AlertCircle, Clock, FileText, CheckCircle2, Download, Printer, Filter } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { payments, updatePaymentStatus } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);

  // Calculations for summary cards
  const totalPaidRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, curr) => acc + curr.finalAmount, 0);

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((acc, curr) => acc + curr.finalAmount, 0);

  const totalFailed = payments.filter((p) => p.status === 'failed').length;

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (methodFilter !== 'all' && p.method !== methodFilter && p.paymentMethod !== methodFilter) return false;
    return true;
  });

  const columns: Column<Payment>[] = [
    {
      key: 'invoiceNumber',
      header: 'شماره فاکتور',
      sortable: true,
      render: (p) => <span className="font-mono font-extrabold text-[#FF7A1A]">{p.invoiceNumber}</span>,
    },
    {
      key: 'gymName',
      header: 'نام مجموعه / پرداخت‌کننده',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-bold text-white block">{p.gymName}</span>
          <span className="text-[11px] text-slate-400 font-mono">{p.memberName}</span>
        </div>
      ),
    },
    {
      key: 'finalAmount',
      header: 'مبلغ نهایی (تومان)',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-extrabold text-white text-xs md:text-sm">
          {p.finalAmount.toLocaleString('fa-IR')} تومان
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'روش پرداخت',
      sortable: true,
      render: (p) => {
        const methodMap: Record<string, string> = {
          zarinpal: 'درگاه زرین‌پال',
          bank_transfer: 'حواله پایا / ساتنا',
          pos: 'کارتخوان (POS)',
          card_to_card: 'کارت به کارت',
        };
        return <span className="text-slate-300 text-xs font-semibold">{methodMap[p.paymentMethod] || p.paymentMethod}</span>;
      },
    },
    {
      key: 'status',
      header: 'وضعیت فاکتور',
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'date',
      header: 'تاریخ تراکنش',
      sortable: true,
      render: (p) => <span className="font-mono text-xs text-slate-400">{p.date}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="امور مالی و فاکتورهای شبکه"
        subtitle="مدیریت تراکنش‌ها، فاکتورهای رسمی و درگاه‌های انلاین"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="مجموع درآمد دریافتی (تومان)"
          value={`${(totalPaidRevenue / 1000000).toLocaleString('fa-IR')} میلیون`}
          icon={Wallet}
          accentColor="emerald"
          subtext="فاکتورهای تایید شده"
        />
        <StatCard
          title="پرداخت‌های در انتظار (تومان)"
          value={`${(totalPending / 1000000).toLocaleString('fa-IR')} میلیون`}
          icon={Clock}
          accentColor="orange"
          subtext="تراکنش‌های معلق"
        />
        <StatCard
          title="تراکنش‌های ناموفق / خطا"
          value={`${totalFailed} مورد`}
          icon={AlertCircle}
          accentColor="purple"
          subtext="نیازمند پیگیری"
        />
      </div>

      {/* Main Transactions Data Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        searchPlaceholder="جستجوی شماره فاکتور، نام باشگاه یا خریدار..."
        searchKeys={['invoiceNumber', 'gymName', 'memberName', 'userEmail']}
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A]"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="paid">پرداخت شده</option>
              <option value="pending">در انتظار پرداخت</option>
              <option value="failed">ناموفق</option>
              <option value="refunded">مسترد شده</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A]"
            >
              <option value="all">همه روش‌ها</option>
              <option value="zarinpal">درگاه زرین‌پال</option>
              <option value="bank_transfer">حواله بانکی</option>
              <option value="pos">دستگاه POS</option>
              <option value="card_to_card">کارت به کارت</option>
            </select>
          </div>
        }
        actions={(payment) => (
          <button
            onClick={() => setViewingPayment(payment)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#FF7A1A] hover:text-slate-950 text-slate-300 text-xs font-bold transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>مشاهده فاکتور</span>
          </button>
        )}
      />

      {/* INVOICE DETAIL MODAL */}
      {viewingPayment && (
        <Modal
          isOpen={!!viewingPayment}
          onClose={() => setViewingPayment(null)}
          title={`صورتحساب رسمی ${viewingPayment.invoiceNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-right">
            {/* Invoice Top Header Card */}
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#FF7A1A] font-bold">فاکتور رسمی فیتوپیا</span>
                <h4 className="text-lg font-black text-white mt-0.5">{viewingPayment.gymName}</h4>
                <p className="text-xs text-slate-400 mt-0.5">تاریخ صدور: {viewingPayment.date}</p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={viewingPayment.status} />

                {/* Quick status change */}
                <select
                  value={viewingPayment.status}
                  onChange={(e) => {
                    const nextSt = e.target.value as PaymentStatus;
                    updatePaymentStatus(viewingPayment.id, nextSt);
                    setViewingPayment({ ...viewingPayment, status: nextSt });
                  }}
                  className="bg-[#222] border border-[#333] text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7A1A]"
                >
                  <option value="paid">پرداخت شده</option>
                  <option value="pending">در انتظار</option>
                  <option value="failed">ناموفق</option>
                  <option value="refunded">مسترد شده</option>
                </select>
              </div>
            </div>

            {/* Line items Table */}
            <div className="overflow-hidden border border-[#262626] rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#181818] border-b border-[#262626] text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">شرح خدمت / کالا</th>
                    <th className="p-3 text-center">تعداد</th>
                    <th className="p-3">مبلغ واحد (تومان)</th>
                    <th className="p-3">مبلغ کل (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222] bg-[#141414] text-slate-200">
                  {viewingPayment.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-white">{item.description}</td>
                      <td className="p-3 text-center font-mono">{item.quantity}</td>
                      <td className="p-3 font-mono">{item.unitPrice.toLocaleString('fa-IR')}</td>
                      <td className="p-3 font-mono font-bold text-white">{item.total.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Calculations */}
            <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-2 text-xs max-w-sm mr-auto">
              <div className="flex justify-between text-slate-400">
                <span>جمع کل اقلام:</span>
                <span className="font-mono text-white">{viewingPayment.amount.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>مالیات بر ارزش افزوده (۱۰٪):</span>
                <span className="font-mono text-white">{viewingPayment.tax.toLocaleString('fa-IR')} تومان</span>
              </div>
              {viewingPayment.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>تخفیف ویژه:</span>
                  <span className="font-mono">- {viewingPayment.discount.toLocaleString('fa-IR')} تومان</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-[#262626]">
                <span className="text-[#FF7A1A]">مبلغ نهایی پرداخت:</span>
                <span className="font-mono text-[#FF7A1A] text-base">
                  {viewingPayment.finalAmount.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>

            {/* Invoice Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#333] bg-[#222] text-slate-200 text-xs font-bold hover:bg-[#2A2A2A] transition-colors"
                >
                  <Printer className="w-4 h-4 text-[#FF7A1A]" />
                  <span>چاپ فاکتور</span>
                </button>
                <button
                  onClick={() => alert('نسخه PDF فاکتور دانلود شد.')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#333] bg-[#222] text-slate-200 text-xs font-bold hover:bg-[#2A2A2A] transition-colors"
                >
                  <Download className="w-4 h-4 text-[#FF7A1A]" />
                  <span>دانلود PDF</span>
                </button>
              </div>

              <button
                onClick={() => setViewingPayment(null)}
                className="px-5 py-2 rounded-xl bg-[#222] text-slate-300 text-xs font-bold hover:bg-[#2C2C2C]"
              >
                بستن
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
