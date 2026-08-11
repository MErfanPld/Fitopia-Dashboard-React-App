import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Toast } from '../common/Toast';

/** Auth is enforced by ProtectedRoute — do not re-check here. */
export const AdminLayout: React.FC = () => (
  <div className="min-h-screen bg-background text-ink flex font-sans" dir="rtl">
    <Sidebar />
    <div className="flex-1 lg:mr-64 mr-0 flex flex-col min-w-0 min-h-screen">
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
      <footer className="px-4 sm:px-8 py-4 border-t border-border text-xs text-muted-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>فیتوپیا — پنل مدیریت باشگاه</span>
        <div className="flex gap-3 text-[11px]">
          <Link to="/guide" className="hover:text-primary transition-colors">راهنما</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">حریم خصوصی</Link>
        </div>
      </footer>
    </div>
    <Toast />
  </div>
);
