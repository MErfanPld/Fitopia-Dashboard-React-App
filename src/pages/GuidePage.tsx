import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  LogIn,
  Building2,
  Users,
  UserCheck,
  DollarSign,
  Ticket,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Header } from '../components/common/Header';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge: string;
  summary: string;
  steps: string[];
}

export const GuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'login': true,
    'gym': true,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allOpened: Record<string, boolean> = {};
    guideSections.forEach((s) => (allOpened[s.id] = true));
    setOpenSections(allOpened);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  const guideSections: GuideSection[] = [
    {
      id: 'login',
      title: '۱. ورود و مدیریت نشست‌های کاری (Authentication)',
      icon: LogIn,
      badge: 'گام اول',
      summary: 'نحوه ورود به پنل، احراز هویت امن و مدیریت خروج خودکار هنگام منقضی شدن توکن دسترسی.',
      steps: [
        'جهت ورود به پنل، شماره تلفن همراه ثبت‌شده و رمز عبور اختصاصی باشگاه خود را در فرم لاگین وارد نمایید.',
        'در صورت صحت اطلاعات، توکن دسترسی امن دریافت شده و به داشبورد اصلی منتقل می‌شوید.',
        'چنانچه برای مدت طولانی غیرفعال باشید یا توکن دسترسی شما منقضی شود (خطای 401)، سامانه شما را به صفحه خوش‌آمدگویی (Welcome) هدایت کرده و پس از اعلام پایان نشست، امکان ورود مجدد فراهم می‌گردد.',
      ],
    },
    {
      id: 'gym',
      title: '۲. ویرایش و به‌روزرسانی اطلاعات باشگاه (Gym Info & Change Requests)',
      icon: Building2,
      badge: 'اطلاعات پایه',
      summary: 'مشاهده مشخصات عمومی باشگاه، موقعیت مکانی و ثبت درخواست تغییر برای موارد نیازمند تایید.',
      steps: [
        'از منوی سمت راست وارد بخش «مشخصات باشگاه» شوید.',
        'اطلاعات تماس، آدرس دقیق، ساعات کاری و رشته‌های فعال باشگاه را مشاهده و بررسی نمایید.',
        'تغییرات حساس (مانند تغییر نام باشگاه، تغییر آدرس یا نقشه) نیازمند ثبت «درخواست تغییر» (Change Request) است که پس از ثبت، توسط تیم پشتیبانی فیتوپیا بررسی و تایید می‌گردد.',
      ],
    },
    {
      id: 'coaches',
      title: '۳. مدیریت مربیان و کادر ورزشی (Coaches Management)',
      icon: Users,
      badge: 'کادر فنی',
      summary: 'تعریف مربیان جدید، تخصیص رشته‌های ورزشی، درج سوابق و مدیریت لیست کادر ورزشی.',
      steps: [
        'به بخش «مربیان» در منوی اصلی مراجعه کنید.',
        'برای افزودن مربی جدید، روی دکمه «افزودن مربی» کلیک کرده، نام، شماره همراه و رشته ورزشی تخصصی وی را انتخاب نمایید.',
        'امکان ویرایش مشخصات یا حذف پرونده مربیان در هر زمان فراهم می‌باشد.',
      ],
    },
    {
      id: 'customers',
      title: '۴. ثبت و مدیریت پرونده مشتریان و ورزشکاران (Customers Management)',
      icon: UserCheck,
      badge: 'ورزشکاران',
      summary: 'ثبت‌نام اعضای جدید باشگاه، فیلتر بر اساس رشته ورزشی و مشاهده وضعیت حساب کاربری.',
      steps: [
        'در صفحه «مشتریان»، لیست تمامی ورزشکاران عضو باشگاه خود را مشاهده می‌کنید.',
        'برای ثبت عضو جدید، دکمه «افزودن مشتری» را زده و نام، شماره تماس، رشته ورزشی و تاریخ عضویت را وارد کنید.',
        'از نوار ابزار بالای جدول می‌توانید اعضا را بر اساس رشته ورزشی فیلتر کنید یا نام/شماره همراه را جستجو نمایید.',
        'علامت سبز رنگ «کاربر فیتوپیا» نشان‌دهنده نصب و فعال بودن اپلیکیشن فیتوپیا توسط ورزشکار است.',
      ],
    },
    {
      id: 'prices',
      title: '۵. مدیریت قیمت‌ها و تعرفه‌های سانس‌ها (Prices & Rates)',
      icon: DollarSign,
      badge: 'مالی و تعرفه',
      summary: 'تعریف شهریه متغیر بر اساس رشته ورزشی، جنسیت (آقایان/بانوان) و نوع سانس.',
      steps: [
        'در بخش «مدیریت قیمت‌ها»، تعرفه‌های فعلی هر رشته ورزشی را مشاهده کنید.',
        'برای افزودن نرخ جدید، دکمه «تعریف قیمت جدید» را انتخاب کرده، رشته ورزشی، جنسیت و مبلغ شهریه ماهانه یا تک‌جلسه را مشخص نمایید.',
        'تغییرات قیمت پس از ثبت به صورت لحظه‌ای در اپلیکیشن فیتوپیا برای کاربران به روز می‌گردد.',
      ],
    },
    {
      id: 'tickets',
      title: '۶. ثبت درخواست تغییر و تیکت‌های پشتیبانی (Tickets & Support)',
      icon: Ticket,
      badge: 'پشتیبانی',
      summary: 'ارتباط مستقیم با کارشناسان فیتوپیا، پیگیری تیکت‌ها و دریافت پاسخ‌های سیستم.',
      steps: [
        'از بخش «پشتیبانی و تیکت‌ها» می‌توانید درخواست‌های تغییر اطلاعات باشگاه یا پیشنهادات خود را ارسال کنید.',
        'وضعیت هر تیکت به صورت «در حال بررسی»، «تایید شده» یا «رد شده» نمایش داده می‌شود.',
        'اعلان‌های مربوط به تغییر وضعیت تیکت‌ها در زنگوله بالای پنل به شما اطلاع‌رسانی خواهد شد.',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Header title="راهنمای جامع استفاده از پنل فیتوپیا" subtitle="راهنمای گام‌به‌گام بهره‌برداری از امکانات سامانه مدیریت باشگاه" />

      {/* Hero Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#1A1A1A] via-[#141414] to-[#0D0D0D] border border-[#2A2A2A] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 max-w-2xl text-right z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20">
            <BookOpen className="w-3.5 h-3.5" />
            <span>مرکز راهنما و آموزش سامانه</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            چگونه بهترین استفاده را از پنل مدیریت «فیتوپیا» داشته باشیم؟
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            این راهنما شما را با تمامی قابلیت‌های مدیریت باشگاه، ثبت اعضا، تنظیم تعرفه‌ها و ارتباط با پشتیبانی آشنا می‌سازد.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#FF7A1A]/20 transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به داشبورد</span>
            </button>
            <button
              onClick={expandAll}
              className="px-3.5 py-2 bg-[#222] hover:bg-[#2A2A2A] text-slate-300 rounded-xl text-xs font-bold border border-[#333] transition-colors cursor-pointer"
            >
              باز کردن همه بخش‌ها
            </button>
            <button
              onClick={collapseAll}
              className="px-3.5 py-2 bg-[#222] hover:bg-[#2A2A2A] text-slate-400 rounded-xl text-xs font-bold border border-[#333] transition-colors cursor-pointer"
            >
              بستن همه
            </button>
          </div>
        </div>

        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-[#FF7A1A]/10 border border-[#FF7A1A]/30 flex items-center justify-center text-[#FF7A1A] shrink-0">
          <HelpCircle className="w-12 h-12 md:w-16 md:h-16" />
        </div>
      </div>

      {/* Accordion Sections List */}
      <div className="space-y-4">
        {guideSections.map((sec) => {
          const isOpen = !!openSections[sec.id];
          const IconComponent = sec.icon;

          return (
            <div
              key={sec.id}
              className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleSection(sec.id)}
                className="w-full p-4 md:p-5 flex items-center justify-between text-right hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-[#FF7A1A] shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm md:text-base text-white">{sec.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20">
                        {sec.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{sec.summary}</p>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-[#222] text-slate-400 shrink-0 mr-2">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="p-4 md:p-5 pt-0 border-t border-[#222] bg-[#111] space-y-3 animate-in fade-in">
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">{sec.summary}</p>
                  <div className="space-y-2 pt-2">
                    {sec.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-[#171717] p-3 rounded-xl border border-[#242424]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#FF7A1A]" />
          <div>
            <h4 className="text-xs font-bold text-white">سؤالی دارید یا به راهنمایی بیشتری نیاز دارید؟</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">تیم پشتیبانی فیتوپیا همواره آماده پاسخگویی و راهنمایی شماست.</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/tickets')}
          className="px-4 py-2 bg-[#222] hover:bg-[#2A2A2A] text-[#FF7A1A] border border-[#FF7A1A]/30 font-bold rounded-xl text-xs transition-all cursor-pointer"
        >
          ارسال تیکت به پشتیبانی
        </button>
      </div>
    </div>
  );
};
