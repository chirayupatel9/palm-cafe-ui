import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Right-side slide-in panel (sheet/drawer) for transient UI such as a cart.
 *
 * @param {Object} props - Component props.
 * @param {boolean} props.open - Whether the sheet is visible.
 * @param {function} props.onClose - Callback invoked to close the sheet (Escape key, overlay click, or close button).
 * @param {import('react').ReactNode} props.children - Content rendered inside the sheet.
 * @param {string} [props.title=''] - Optional title exposed to assistive technologies and displayed in the header.
 * @param {string} [props.className=''] - Additional CSS classes applied to the panel container.
 * @returns {JSX.Element|null} The sheet DOM structure when `open` is true, or `null` when closed.
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
      {/* Panel - right side, Material-style elevation; wider on desktop */}
      <div
        className={`absolute inset-y-0 right-0 w-full sm:max-w-md lg:max-w-lg flex flex-col animate-slide-in-right shadow-2xl ${className}`}
        style={{
          boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,.1))',
          backgroundColor: 'var(--surface-card)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b sheet-header-border">
          {title && <h2 className="text-lg font-semibold text-on-surface">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2 rounded-full text-on-surface-variant hover:bg-[var(--color-outline-variant)] hover:text-on-surface transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
