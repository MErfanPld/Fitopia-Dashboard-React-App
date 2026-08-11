import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Toast } from '../common/Toast';

/** Auth is enforced by ProtectedRoute — do not re-check here via useApp/UIContext. */
export const AdminLayout: React.FC = () => (
  <div className="min-h-screen bg-[#0D0D0D] text-slate-100 flex font-['Vazirmatn',sans-serif]" dir="rtl">
    <Sidebar />
    <div className="flex-1 lg:mr-64 mr-0 flex flex-col min-w-0 min-h-screen">
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <Outlet />
      </main>
      <footer className="px-4 sm:px-8 py-4 border-t border-[#222] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>\u0641\u06cc\u062a\u0648\u067e\u06cc\u0627 \u2014 \u067e\u0646\u0644 \u0645\u062f\u06cc\u0631\u06cc\u062a \u0628\u0627\u0634\u06af\u0627\u0647</span>
        <div className="flex gap-3 text-[11px]">
          <Link to="/guide" className="hover:text-slate-300">\u0631\u0627\u0647\u0646\u0645\u0627</Link>
          <Link to="/privacy" className="hover:text-slate-300">\u062d\u0631\u06cc\u0645 \u062e\u0635\u0648\u0635\u06cc</Link>
        </div>
      </footer>
    </div>
    <Toast />
  </div>
);
