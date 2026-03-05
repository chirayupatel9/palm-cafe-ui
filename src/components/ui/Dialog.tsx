import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

const sizeClasses: Record<string, string> = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '4xl': 'sm:max-w-4xl'
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  className?: string;
  maxHeight?: boolean;
  size?: keyof typeof sizeClasses;
}

const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  children,
  title = '',
  className = '',
  maxHeight = true,
  size = 'md'
}) => {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.pointerEvents = 'none';
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.style.pointerEvents = 'none';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.pointerEvents = '';
      if (rootEl) rootEl.style.pointerEvents = '';
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = sizeClasses[size] || sizeClasses.md;
  const content = (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      data-dialog="template"
    >
      <div
        className="absolute inset-0 w-full h-full min-w-full min-h-full bg-black/50 transition-opacity cursor-default"
        onClick={onClose}
        onMouseDown={(e) => e.preventDefault()}
        aria-hidden="true"
      />
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[calc(100%-2rem)] ${maxW} bg-surface-card rounded-3xl shadow-xl flex flex-col ${maxHeight ? 'max-h-[90vh]' : ''} overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between flex-shrink-0 px-6 pt-6 pb-5">
          {title ? (
            <h2 id="dialog-title" className="text-xl font-bold text-[#0b0f05]">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2 rounded-full text-[#b3af9b] hover:bg-[#e1e5df] hover:text-[#0b0f05] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className={`flex-1 overflow-y-auto px-6 pb-6 pt-1 ${maxHeight ? 'max-h-[calc(90vh-80px)]' : ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default Dialog;
