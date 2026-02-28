import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

/**
 * Render a themed file input that hides the native control and displays a "Choose file" button and the current filename or a placeholder.
 *
 * Calls `onChange` with the selected `File` or `null` when a selection occurs and clears the hidden input value so the same file can be re-selected.
 *
 * @param {File|null} [selectedFile] - Current selected file used to display its name; `null` shows the placeholder.
 * @param {(file: File|null) => void} onChange - Callback invoked with the selected `File` or `null`.
 * @param {string} [accept] - Comma-separated list of accepted MIME types or file extensions (e.g. "image/jpeg,image/png").
 * @param {string} [placeholder='No file chosen'] - Text shown when no file is selected.
 * @param {boolean} [disabled=false] - When true, disables interaction with the control.
 * @param {string} [className=''] - Additional CSS classes applied to the wrapper.
 * @param {string} [id] - ID applied to the underlying hidden input.
 * @returns {JSX.Element} The rendered file input component.
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
