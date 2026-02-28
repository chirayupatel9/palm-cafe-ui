import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Themed dropdown select. Renders a custom list (not native HTML) so the
 * open state uses app theme (surface, shadow, primary hover).
 *
 * @param {Array<{value: string, label: string}>} options
 * @param {string} value - current value
 * @param {function(string): void} onChange
 * @param {string} [placeholder] - shown when no value
 * @param {string} [className] - extra classes for trigger
 * @param {string} [id] - for aria
 */
function Select({ options = [], value, onChange, placeholder = 'Select...', className = '', id }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));
  const displayLabel = selected ? selected.label : placeholder;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={`input-field w-full min-h-[40px] text-left flex items-center justify-between gap-2 pr-10 cursor-pointer ${className}`}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: open ? 'var(--color-primary)' : 'var(--color-outline)',
          color: 'var(--color-on-surface)',
          boxShadow: open ? 'var(--elevation-2)' : 'var(--elevation-1)'
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={id ? `${id}-label` : undefined}
      >
        <span className={!selected ? 'opacity-70' : ''}>{displayLabel}</span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-primary)' }}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 py-1 z-50 rounded-xl overflow-hidden border min-w-[160px] max-h-60 overflow-y-auto"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-outline)',
            boxShadow: 'var(--elevation-3)'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange(opt.value);
                    setOpen(false);
                  }
                }}
                className="px-4 py-2.5 cursor-pointer transition-colors text-sm hover:opacity-90"
                style={{
                  color: 'var(--color-on-surface)',
                  backgroundColor: isSelected ? 'var(--color-primary-container)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-variant)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Select;
