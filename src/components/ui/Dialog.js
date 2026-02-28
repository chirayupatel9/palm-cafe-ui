import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

/**
 * Template-style Dialog (centered modal). Use for Profile, Login, Edit Profile.
 * Renders via portal into document.body so it always appears on top.
 */
const sizeClasses = { md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-xl', '2xl': 'sm:max-w-2xl', '4xl': 'sm:max-w-4xl' };

/**
 * Render a centered modal dialog mounted into document.body with backdrop, header, and close behaviors.
 *
 * @param {Object} props - Component props.
 * @param {boolean} props.open - Whether the dialog is visible.
 * @param {() => void} props.onClose - Callback invoked to close the dialog (called on overlay click, close button, or Escape key).
 * @param {import('react').ReactNode} props.children - Content rendered inside the dialog body.
 * @param {string} [props.title=''] - Optional header title; when provided used for aria-labelledby.
 * @param {string} [props.className=''] - Additional CSS classes applied to the dialog content container.
 * @param {boolean} [props.maxHeight=true] - When true constrain the dialog and body with a max-height to enable internal scrolling.
 * @param {'md'|'lg'|'xl'|'2xl'|'4xl'} [props.size='md'] - Size key controlling the dialog's max-width variant.
 * @returns {import('react').ReactElement|null} The dialog portal element when `open` is true, or `null` when `open` is false.
 */
function Dialog({ open, onClose, children, title = '', className = '', maxHeight = true, size = 'md' }) {
  const maxW = sizeClasses[size] || sizeClasses.md;
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

  const content = (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-labelledby={title ? 'dialog-title' : undefined} data-dialog="template">
      {/* Overlay - template: bg-black/50 */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Content - template: centered, sm:max-w-md, rounded-2xl */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[calc(100%-2rem)] ${maxW} bg-white rounded-3xl shadow-xl flex flex-col ${maxHeight ? 'max-h-[90vh]' : ''} overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between flex-shrink-0 px-6 pt-6 pb-5">
          {title ? <h2 id="dialog-title" className="text-xl font-bold text-[#2A2A2A]">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2 rounded-full text-[#6F6A63] hover:bg-[#F6F4F0] hover:text-[#2A2A2A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`flex-1 overflow-y-auto px-6 pb-6 pt-1 ${maxHeight ? 'max-h-[calc(90vh-80px)]' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}

export default Dialog;
