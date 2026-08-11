import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm fitopia-modal-overlay"
        style={{ background: 'var(--fitopia-overlay)' }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${sizeMap[size]} bg-surface border border-border rounded-2xl overflow-hidden fitopia-modal-panel`}
        style={{ boxShadow: 'var(--fitopia-shadow)' }}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border flex items-center justify-between bg-header">
            <h2 className="text-base font-bold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-xl transition-colors duration-200"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto text-ink bg-surface">{children}</div>
      </div>
    </div>
  );
};
