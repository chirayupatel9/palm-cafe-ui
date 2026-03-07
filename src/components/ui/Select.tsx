import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options?: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const Select: React.FC<SelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  id
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
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

  const TriggerChevron = ({ openState }: { openState: boolean }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-5 h-5 shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${openState ? 'rotate-180' : ''}`}
      style={{ color: 'var(--color-primary)' }}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger: solid light bg, rounded corners, thin light border (All Categories style) */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={`select-trigger-glass-hover w-full min-h-[40px] text-left flex items-center justify-between gap-2 pr-10 cursor-pointer rounded-xl border px-4 ${className}`}
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: open ? 'var(--color-primary)' : 'var(--color-outline-variant)',
          color: 'var(--color-on-surface)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={id ? `${id}-label` : undefined}
      >
        <span className={!selected ? 'opacity-70' : ''}>{displayLabel}</span>
        <TriggerChevron openState={open} />
      </button>

      {/* Dropdown panel: glass effect (frosted, soft shadow) */}
      {open && (
        <ul
          role="listbox"
          className="select-dropdown-glass absolute left-0 right-0 top-full mt-1.5 z-[100] rounded-2xl overflow-hidden min-w-[160px] max-h-60 overflow-y-auto py-2 transition-all duration-200"
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
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange(opt.value);
                    setOpen(false);
                  }
                }}
                className={`select-option px-4 py-3 cursor-pointer transition-colors duration-150 text-sm font-medium rounded-lg mx-1.5 ${isSelected ? 'select-option-selected' : ''}`}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Select;
