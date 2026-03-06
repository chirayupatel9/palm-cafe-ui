import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { GlassButton } from './GlassButton';

export interface FileInputProps {
  selectedFile?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const FileInput: React.FC<FileInputProps> = ({
  selectedFile,
  onChange,
  accept,
  placeholder = 'No file chosen',
  disabled = false,
  className = '',
  id
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) inputRef.current.click();
  };

  return (
    <div
      className={`glass-file-input-wrap flex items-center gap-3 min-h-[44px] px-3 py-2 ${className}`}
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
      <GlassButton
        type="button"
        onClick={handleClick}
        disabled={disabled}
        size="sm"
        className="glass-button-secondary shrink-0"
        contentClassName="inline-flex items-center gap-2"
      >
        <Upload className="h-4 w-4 shrink-0" aria-hidden />
        Choose file
      </GlassButton>
      <span
        className={`flex-1 min-w-0 truncate text-sm ${selectedFile ? 'text-[var(--color-on-surface)]' : 'text-[var(--color-on-surface-variant)]'}`}
      >
        {selectedFile ? selectedFile.name : placeholder}
      </span>
    </div>
  );
};

export default FileInput;
