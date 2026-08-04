import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Database,
  EyeOff,
  UserCheck,
  Headphones,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Header } from '../components/common/Header';

export const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  const privacySections = [
    {
      icon: ShieldCheck,
      title: '۱. مقدمه و تعهد فیتوپیا به حریم خصوصی',
      content:
        'سامانه جامع مدیریت باشگاه‌های ورزشی «فیتوپیا» خود را متعهد به صیانت کامل از اطلاعات شخصی و تجاری باشگاه‌داران، مربیان و ورزشکاران می‌داند. این بیانیه نحوه جمع‌آوری، استفاده، ذخیره‌سازی و حفاظت از داده‌ها را تشریح می‌کند.',
    },
    {
      icon: Database,
      title: '۲. داده‌های جمع‌آوری‌شده و اهداف آن',
      content:
        'اطلاعات جمع‌آوری‌شده شامل مشخصات عمومی باشگاه (نام، آدرس، موقعیت جغرافیایی و تلفن تماس)، مشخصات مربیان، پرونده اعضا (نام، شماره تماس، رشته ورزشی و تاریخ ثبت‌نام) و اطلاعات تیکت‌های پشتیبانی می‌باشد. کلیه این اطلاعات صرفاً جهت ارائه خدمات مدیریتی، اطلاع‌رسانی تعرفه‌ها و هماهنگی‌های ورزشی استفاده می‌شود.',
    },
    {
      icon: Lock,
      title: '۳. نحوه نگهداری و امنیت اطلاعات',
      content:
        'کلیه داده‌های حساس و توکن‌های احراز هویت با استفاده از پروتکل‌های رمزنگاری پیشرفته (SSL/TLS) انتقال یافته و در دیتابیس‌های امن با سطوح دسترسی طبقه‌بندی‌شده نگهداری می‌شوند. پشتیبان‌گیری منظم و نظارت ۲۴/۷ برای جلوگیری از دسترسی غیرمجاز اعمال می‌گردد.',
    },
    {
      icon: EyeOff,
      title: '۴. عدم افشا و عدم اشتراک‌گذاری با اشخاص ثالث',
      content:
        'فیتوپیا متعهد است که اطلاعات باشگاه‌ها و ورزشکاران را به هیچ عنوان به اشخاص ثالث، شرکت‌های تبلیغاتی یا نهادهای غیرمرتبط نفروشد، اجاره ندهد و افشا نکند. دسترسی به اطلاعات تنها برای پرسنل مجاز فنی جهت ارائه خدمات پشتیبانی امکان‌پذیر است.',
    },
    {
      icon: UserCheck,
      title: '۵. حقوق باشگاه‌داران در مدیریت داده‌ها',
      content:
        'مدیران باشگاه‌ها در هر زمان حق دارند اطلاعات ثبت‌شده باشگاه خود، لیست مربیان و اعضا را مشاهده، ویرایش یا در صورت نیاز درخواست حذف کامل آن را به تیم پشتیبانی فیتوپیا ارائه نمایند.',
    },
    {
      icon: Headphones,
      title: '۶. تماس با بخش حریم خصوصی و پشتیبانی',
      content:
        'در صورت داشتن هرگونه سوال، ابهام یا درخواست در خصوص سیاست‌های حریم خصوصی، می‌توانید از طریق بخش تیکت‌های پشتیبانی در پنل یا ایمیل privacy@fitopia.ir با ما در ارتباط باشید.',
    },
  ];

  return (
    <div className="space-y-6">
      <Header title="سیاست حریم خصوصی و امنیت داده‌ها" subtitle="تعهدنامه رسمی فیتوپیا در صیانت از اطلاعات باشگاه‌ها و اعضا" />

      {/* Hero Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#1A1A1A] via-[#141414] to-[#0D0D0D] border border-[#2A2A2A] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 max-w-2xl text-right z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20">
            <Lock className="w-3.5 h-3.5" />
            <span>حفاظت از داده‌های شما</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            امنیت و حریم خصوصی شما اولویت مطلق ماست
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            در فیتوپیا، حفظ محرمانه بودن اطلاعات باشگاه و اطلاعات اعضای شما تضمین گردیده و طبق استانداردهای امنیتی دقیق مدیریت می‌شود.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#FF7A1A]/20 transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به داشبورد</span>
            </button>
          </div>
        </div>

        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck className="w-12 h-12 md:w-16 md:h-16" />
        </div>
      </div>

      {/* Privacy Clauses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {privacySections.map((sec, idx) => {
          const IconComp = sec.icon;
          return (
            <div key={idx} className="p-5 bg-[#141414] border border-[#262626] rounded-2xl space-y-3 text-right">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-[#FF7A1A] shrink-0">
                  <IconComp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">{sec.title}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{sec.content}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom Security Guarantee */}
      <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="text-xs font-bold text-white">مطابق با استانداردهای پایداری و امنیت داده‌های فیتوپیا</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">آخرین به روزرسانی سند حریم خصوصی: مرداد ۱۴۰۵</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/tickets')}
          className="px-4 py-2 bg-[#222] hover:bg-[#2A2A2A] text-slate-300 border border-[#333] font-bold rounded-xl text-xs transition-all cursor-pointer"
        >
          ارتباط با تیم امنیت
        </button>
      </div>
    </div>
  );
};
