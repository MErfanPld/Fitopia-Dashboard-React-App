import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  User,
  Gym,
  Ticket,
  Payment,
  DashboardStats,
  ActivityLog,
  TicketStatus,
  UserRole,
  UserStatus,
  GymStatus,
  PlanTier,
  PaymentStatus,
} from '../types';
import {
  initialStats,
  initialUsers,
  initialGyms,
  initialTickets,
  initialPayments,
  initialActivities,
} from '../data/mockData';

interface AdminUser {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'danger' | 'info' | 'warning';
}

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  login: (email: string) => void;
  logout: () => void;

  // Stats & Activity
  stats: DashboardStats;
  activities: ActivityLog[];

  // Users CRUD
  users: User[];
  addUser: (user: Omit<User, 'id' | 'joinDate'>) => void;
  updateUser: (id: string, updated: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Gyms CRUD
  gyms: Gym[];
  addGym: (gym: Omit<Gym, 'id' | 'registrationDate' | 'memberCount' | 'classesCount' | 'coachesCount'>) => void;
  updateGym: (id: string, updated: Partial<Gym>) => void;
  deleteGym: (id: string) => void;

  // Tickets CRUD
  tickets: Ticket[];
  addTicket: (ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'date' | 'updatedAt' | 'messages'>, initialMessage: string) => void;
  addReplyToTicket: (ticketId: string, messageText: string) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;

  // Payments
  payments: Payment[];
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => void;

  // Toast System
  toast: ToastMessage | null;
  showToast: (message: string, type?: ToastMessage['type']) => void;
  clearToast: () => void;

  // Mobile Drawer Navigation
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Logged in by default for preview, can logout to test /login
  const [adminUser, setAdminUser] = useState<AdminUser | null>({
    name: 'امیرحسین رضایی',
    email: 'admin@fitopia.ir',
    role: 'مدیر کل فیتوپیا',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  });

  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [gyms, setGyms] = useState<Gym[]>(initialGyms);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const clearToast = () => setToast(null);

  const login = (email: string) => {
    setIsAuthenticated(true);
    setAdminUser({
      name: email.split('@')[0] || 'مدیر سیستم',
      email: email,
      role: 'مدیر کل فیتوپیا',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    });
    showToast('ورود با موفقیت انجام شد. خوش آمدید!', 'success');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminUser(null);
    showToast('شما با موفقیت از سیستم خارج شدید.', 'info');
  };

  const logActivity = (action: string, details: string, type: ActivityLog['type'], severity: ActivityLog['severity']) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      action,
      user: adminUser?.name || 'مدیر',
      details,
      timestamp: 'همین الان',
      type,
      severity,
    };
    setActivities((prev) => [newLog, ...prev]);
  };

  // User Actions
  const addUser = (userData: Omit<User, 'id' | 'joinDate'>) => {
    const newId = `usr-${Date.now().toString().slice(-4)}`;
    const today = new Date();
    const shamsiDate = '1403/05/11';
    const newUser: User = {
      ...userData,
      id: newId,
      joinDate: shamsiDate,
    };
    setUsers((prev) => [newUser, ...prev]);
    logActivity('ایجاد کاربر جدید', `کاربر ${newUser.name} با نقش ${newUser.role} اضافه شد.`, 'user', 'success');
    showToast(`کاربر "${newUser.name}" با موفقیت ایجاد شد.`, 'success');
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updatedUser = { ...u, ...updated };
          logActivity('ویرایش کاربر', `اطلاعات کاربر ${updatedUser.name} بروزرسانی شد.`, 'user', 'info');
          return updatedUser;
        }
        return u;
      })
    );
    showToast('اطلاعات کاربر بروزرسانی شد.', 'success');
  };

  const deleteUser = (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (targetUser) {
      logActivity('حذف کاربر', `کاربر ${targetUser.name} از سیستم حذف گردید.`, 'user', 'danger');
      showToast(`کاربر "${targetUser.name}" حذف شد.`, 'danger');
    }
  };

  // Gym Actions
  const addGym = (gymData: Omit<Gym, 'id' | 'registrationDate' | 'memberCount' | 'classesCount' | 'coachesCount'>) => {
    const newId = `gym-${Date.now().toString().slice(-4)}`;
    const newGym: Gym = {
      ...gymData,
      id: newId,
      memberCount: 0,
      classesCount: 0,
      coachesCount: 1,
      registrationDate: '1403/05/11',
    };
    setGyms((prev) => [newGym, ...prev]);
    logActivity('ثبت باشگاه جدید', `باشگاه ${newGym.name} در شهر ${newGym.city} ثبت شد.`, 'gym', 'success');
    showToast(`باشگاه "${newGym.name}" با موفقیت اضافه شد.`, 'success');
  };

  const updateGym = (id: string, updated: Partial<Gym>) => {
    setGyms((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updatedGym = { ...g, ...updated };
          logActivity('ویرایش باشگاه', `اطلاعات باشگاه ${updatedGym.name} ویرایش شد.`, 'gym', 'info');
          return updatedGym;
        }
        return g;
      })
    );
    showToast('اطلاعات باشگاه بروزرسانی شد.', 'success');
  };

  const deleteGym = (id: string) => {
    const targetGym = gyms.find((g) => g.id === id);
    setGyms((prev) => prev.filter((g) => g.id !== id));
    if (targetGym) {
      logActivity('حذف باشگاه', `باشگاه ${targetGym.name} از سامانه حذف گردید.`, 'gym', 'danger');
      showToast(`باشگاه "${targetGym.name}" حذف شد.`, 'danger');
    }
  };

  // Ticket Actions
  const addTicket = (
    ticketData: Omit<Ticket, 'id' | 'ticketNumber' | 'date' | 'updatedAt' | 'messages'>,
    initialMessage: string
  ) => {
    const newId = `tkt-${Date.now().toString().slice(-3)}`;
    const number = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = '1403/05/11 - 16:00';
    const newTicket: Ticket = {
      ...ticketData,
      id: newId,
      ticketNumber: number,
      date: now,
      updatedAt: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderName: ticketData.submittedBy,
          senderRole: 'user',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          message: initialMessage,
          timestamp: now,
        },
      ],
    };
    setTickets((prev) => [newTicket, ...prev]);
    setStats((prev) => ({ ...prev, openTickets: prev.openTickets + 1 }));
    logActivity('ایجاد تیکت پشتیبانی', `تیکت ${number} با موضوع "${ticketData.subject}" ثبت گردید.`, 'ticket', 'warning');
    showToast(`تیکت جدید با شماره ${number} ثبت گردید.`, 'success');
  };

  const addReplyToTicket = (ticketId: string, messageText: string) => {
    const now = '1403/05/11 - 16:15';
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            senderName: adminUser?.name || 'پشتیبانی',
            senderRole: 'support' as const,
            avatar: adminUser?.avatar,
            message: messageText,
            timestamp: now,
          };
          const updated = {
            ...t,
            updatedAt: now,
            status: t.status === 'open' ? ('in_progress' as const) : t.status,
            messages: [...t.messages, newMsg],
          };
          return updated;
        }
        return t;
      })
    );
    showToast('پاسخ شما ارسال شد.', 'success');
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return { ...t, status };
        }
        return t;
      })
    );
    showToast('وضعیت تیکت تغییر کرد.', 'info');
  };

  // Payment Actions
  const updatePaymentStatus = (paymentId: string, status: PaymentStatus) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return { ...p, status };
        }
        return p;
      })
    );
    showToast('وضعیت پرداخت بروزرسانی شد.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        adminUser,
        login,
        logout,
        stats,
        activities,
        users,
        addUser,
        updateUser,
        deleteUser,
        gyms,
        addGym,
        updateGym,
        deleteGym,
        tickets,
        addTicket,
        addReplyToTicket,
        updateTicketStatus,
        payments,
        updatePaymentStatus,
        toast,
        showToast,
        clearToast,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
