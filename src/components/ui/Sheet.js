import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Template-style Sheet (right-side drawer). Use for Cart.
 * No Radix dependency; plain React + Tailwind.
 */
function Sheet({ open, onClose, children, title = '', className = '' }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={title || 'Panel'}>
      {/* Overlay - template: bg-black/50 */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel - template: right side, w-full sm:max-w-md, slide-in */}
      <div
        className={`absolute inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-[#2A2A2A]/10">
          {title && <h2 className="text-xl font-bold text-[#2A2A2A]">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2 rounded-full text-[#6F6A63] hover:bg-[#F6F4F0] hover:text-[#2A2A2A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Sheet;
