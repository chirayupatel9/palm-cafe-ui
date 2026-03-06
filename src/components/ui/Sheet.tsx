import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  className?: string;
}

const Sheet: React.FC<SheetProps> = ({ open, onClose, children, title = '', className = '' }) => {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Panel'}
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-y-0 right-0 w-full sm:max-w-md lg:max-w-lg flex flex-col animate-slide-in-right backdrop-blur-2xl bg-white/75 dark:bg-[#0b0f05]/90 border-l border-white/20 dark:border-white/10 shadow-2xl ${className}`}
        style={{
          boxShadow: '0 0 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.05) inset'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-sm">
          {title && <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 text-[var(--color-on-surface)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1 backdrop-blur-sm border border-white/20 dark:border-white/10"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-transparent to-white/10 dark:to-white/5">{children}</div>
      </div>
    </div>
  );
};

export default Sheet;
