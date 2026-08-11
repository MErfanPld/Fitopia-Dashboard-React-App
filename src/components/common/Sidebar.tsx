import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, Dumbbell, Layers, BookOpen,
  ClipboardCheck, Clock, Wallet, ArrowLeftRight, RotateCcw, BarChart3,
  TicketCheck, ScrollText, Settings, LogOut, X, Zap, Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ROLE_LABELS, type StaffRole, type PermissionCode } from '../../types/api';

interface Item { path: string; label: string; icon: React.ElementType; perm?: PermissionCode }

const groups: { title: string; items: Item[] }[] = [
  { title: '\u062f\u0627\u0634\u0628\u0648\u0631\u062f', items: [{ path: '/dashboard', label: '\u0646\u0645\u0627\u06cc \u06a9\u0644\u06cc', icon: LayoutDashboard }] },
  { title: '\u0645\u062f\u06cc\u0631\u06cc\u062a \u0628\u0627\u0634\u06af\u0627\u0647', items: [
    { path: '/members', label: '\u0627\u0639\u0636\u0627', icon: Users, perm: 'customer.view' },
    { path: '/coaches', label: '\u0645\u0631\u0628\u06cc\u0627\u0646', icon: Dumbbell },
    { path: '/employees', label: '\u06a9\u0627\u0631\u06a9\u0646\u0627\u0646', icon: UserCog, perm: 'employee.view' },
    { path: '/offerings', label: '\u062e\u062f\u0645\u0627\u062a \u0648 \u0631\u0634\u062a\u0647\u200c\u0647\u0627', icon: Layers, perm: 'offering.manage' },
    { path: '/courses', label: '\u062f\u0648\u0631\u0647\u200c\u0647\u0627', icon: BookOpen, perm: 'course.view' },
  ]},
  { title: '\u0639\u0645\u0644\u06cc\u0627\u062a', items: [
    { path: '/attendance', label: '\u062d\u0636\u0648\u0631 \u0648 \u063a\u06cc\u0627\u0628', icon: ClipboardCheck, perm: 'attendance.view' },
    { path: '/sessions', label: '\u062c\u0644\u0633\u0627\u062a \u062a\u06a9\u06cc', icon: Clock, perm: 'finance.create' },
  ]},
  { title: '\u0645\u0627\u0644\u06cc', items: [
    { path: '/finance', label: '\u06af\u0632\u0627\u0631\u0634 \u0645\u0627\u0644\u06cc', icon: BarChart3, perm: 'finance.report' },
    { path: '/finance/transactions', label: '\u062a\u0631\u0627\u06a9\u0646\u0634\u200c\u0647\u0627', icon: ArrowLeftRight, perm: 'finance.view' },
    { path: '/finance/payments', label: '\u067e\u0631\u062f\u0627\u062e\u062a\u200c\u0647\u0627', icon: Wallet, perm: 'finance.view' },
    { path: '/finance/refunds', label: '\u0627\u0633\u062a\u0631\u062f\u0627\u062f', icon: RotateCcw, perm: 'finance.refund' },
  ]},
  { title: '\u0633\u06cc\u0633\u062a\u0645', items: [
    { path: '/tickets', label: '\u062a\u06cc\u06a9\u062a\u200c\u0647\u0627', icon: TicketCheck },
    { path: '/audit', label: '\u06af\u0632\u0627\u0631\u0634 \u0641\u0639\u0627\u0644\u06cc\u062a', icon: ScrollText },
    { path: '/settings', label: '\u062a\u0646\u0638\u06cc\u0645\u0627\u062a', icon: Settings },
  ]},
];

export const Sidebar: React.FC = () => {
  const { logout, currentGym, gymAccessList, setCurrentGym, user, can } = useAuth();
  const { isMobileMenuOpen, closeMobileMenu } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const roleLabel =
    currentGym?.role && ROLE_LABELS[currentGym.role as StaffRole]
      ? ROLE_LABELS[currentGym.role as StaffRole]
      : currentGym?.role || '';

  return (
    <>
      {isMobileMenuOpen && <div onClick={closeMobileMenu} className="fixed inset-0 bg-black/75 z-40 lg:hidden" aria-hidden />}
      <aside className={`fixed right-0 top-0 bottom-0 w-72 lg:w-64 bg-[#141414] border-l border-[#262626] flex flex-col z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'max-lg:translate-x-full'}`}>
        <div className="h-16 px-5 border-b border-[#262626] flex items-center justify-between shrink-0">
          <NavLink to="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF9D4D] flex items-center justify-center shadow-lg shadow-[#FF7A1A]/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-white block">\u0641\u06cc\u062a\u0648\u067e\u06cc\u0627</span>
              <span className="text-[11px] text-slate-400">\u067e\u0646\u0644 \u0645\u062f\u06cc\u0631\u06cc\u062a \u0628\u0627\u0634\u06af\u0627\u0647</span>
            </div>
          </NavLink>
          <button type="button" onClick={closeMobileMenu} className="lg:hidden text-slate-400 p-2"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-3 py-3 border-b border-[#262626]">
          <label className="text-[10px] text-slate-500 font-semibold mb-1.5 block px-1">\u0628\u0627\u0634\u06af\u0627\u0647 \u0641\u0639\u0627\u0644</label>
          {gymAccessList.length === 0 ? (
            <div className="text-xs text-slate-500 px-2 py-2 rounded-lg bg-[#1A1A1A]">\u062f\u0633\u062a\u0631\u0633\u06cc \u0628\u0647 \u0628\u0627\u0634\u06af\u0627\u0647\u06cc \u0646\u062f\u0627\u0631\u06cc\u062f</div>
          ) : (
            <div className="relative">
              <Building2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <select
                value={currentGym?.gym ?? ''}
                onChange={(e) => {
                  const g = gymAccessList.find((x) => String(x.gym) === e.target.value);
                  if (g) setCurrentGym(g);
                }}
                className="w-full appearance-none bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white rounded-lg pr-8 pl-3 py-2 focus:outline-none focus:border-[#FF7A1A]/50"
              >
                {gymAccessList.map((g) => (
                  <option key={g.gym} value={g.gym}>{g.gym_name || `\u0628\u0627\u0634\u06af\u0627\u0647 #${g.gym}`}</option>
                ))}
              </select>
            </div>
          )}
          {currentGym && <p className="text-[10px] text-slate-500 mt-1.5 px-1">\u0646\u0642\u0634: {roleLabel}</p>}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {groups.map((group) => {
            const visible = group.items.filter((item) => !item.perm || can(item.perm));
            if (!visible.length) return null;
            return (
              <div key={group.title}>
                <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{group.title}</div>
                <div className="space-y-0.5">
                  {visible.map((item) => {
                    const Icon = item.icon;
                    const active =
                      location.pathname === item.path ||
                      (item.path !== '/dashboard' && item.path !== '/finance' && location.pathname.startsWith(item.path)) ||
                      (item.path === '/finance' && (location.pathname === '/finance' || location.pathname === '/finance/reports'));
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          active ? 'bg-[#FF7A1A]/15 text-[#FF9D4D] font-medium' : 'text-slate-400 hover:text-white hover:bg-[#1F1F1F]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#262626] shrink-0">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username || '\u06a9\u0627\u0631\u0628\u0631'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.phone_number || user?.email || ''}</p>
          </div>
          <button
            type="button"
            onClick={() => { closeMobileMenu(); logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />\u062e\u0631\u0648\u062c \u0627\u0632 \u062d\u0633\u0627\u0628
          </button>
        </div>
      </aside>
    </>
  );
};
