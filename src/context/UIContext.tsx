import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastType = 'success' | 'danger' | 'info' | 'warning';
interface ToastMessage { id: number; message: string; type: ToastType; }
interface UIContextType {
  toast: ToastMessage | null;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ id: Date.now(), message, type });
    window.setTimeout(() => setToast(null), 4000);
  }, []);
  return (
    <UIContext.Provider value={{
      toast, showToast, clearToast: () => setToast(null),
      isMobileMenuOpen,
      toggleMobileMenu: () => setIsMobileMenuOpen((v) => !v),
      closeMobileMenu: () => setIsMobileMenuOpen(false),
    }}>{children}</UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
