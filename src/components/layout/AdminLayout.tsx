import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Toast } from '../common/Toast';
import { useApp } from '../../context/AppContext';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-slate-100 flex font-['Vazirmatn',sans-serif] selection:bg-[#FF7A1A]/30 selection:text-[#FF7A1A]">
      {/* Persistent Right-side Sidebar */}
      <Sidebar />

      {/* Main Content Area (offset by right sidebar width on lg screens) */}
      <div className="flex-1 lg:mr-64 mr-0 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8">
          <Outlet />
        </main>

        {/* Footer info */}
        <footer className="px-4 sm:px-8 py-4 border-t border-[#222] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <span>سامانه جامع مدیریت باشگاه‌های ورزشی «فیتوپیا» © ۱۴۰۳</span>
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] flex-wrap justify-center">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">راهنمای استفاده</span>
            <span>•</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">حریم خصوصی</span>
            <span>•</span>
            <span className="text-[#FF7A1A] font-semibold">نسخه ۳.۲.۰ پایداری</span>
          </div>
        </footer>
      </div>

      {/* Global Toast System */}
      <Toast />
    </div>
  );
};
