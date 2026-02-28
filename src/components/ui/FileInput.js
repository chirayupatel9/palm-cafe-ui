import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

/**
 * Themed file input. Hides the native control and shows a styled "Choose file" button
 * plus filename (or placeholder) so it matches the app's input-field look.
 *
 * @param {File|null} [selectedFile] - current file (for showing name)
 * @param {function(File|null): void} onChange
 * @param {string} [accept] - e.g. "image/jpeg,image/png,image/webp"
 * @param {string} [placeholder] - when no file chosen
 * @param {boolean} [disabled]
 * @param {string} [className]
 * @param {string} [id]
 */
function FileInput({ selectedFile, onChange, accept, placeholder = 'No file chosen', disabled = false, className = '', id }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) inputRef.current.click();
  };

  return (
    <div
      className={`flex items-center gap-3 min-h-[40px] px-3 py-2 rounded-xl border transition-all duration-200 ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-outline)',
        color: 'var(--color-on-surface)',
        boxShadow: 'var(--elevation-0)'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        id={id}
        aria-label={placeholder}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="btn-secondary shrink-0 inline-flex items-center gap-2"
      >
        <Upload className="h-4 w-4" aria-hidden />
        Choose file
      </button>
      <span
        className="flex-1 min-w-0 truncate text-sm"
        style={{ color: 'var(--color-on-surface-variant)' }}
      >
        {selectedFile ? selectedFile.name : placeholder}
      </span>
    </div>
  );
}

export default FileInput;
