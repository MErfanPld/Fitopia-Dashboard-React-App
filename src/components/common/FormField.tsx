import React from 'react';

interface FormFieldProps {
  label: string;
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  options?: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  isTextArea?: boolean;
  isSelect?: boolean;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  rows = 4,
  isTextArea = false,
  isSelect = false,
  helpText,
}) => {
  const inputId = id || `field-${label.replace(/\s+/g, '-')}`;

  const baseInputStyles =
    'w-full bg-[#141414] border border-[#2E2E2E] text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A] transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="space-y-1.5 text-right">
      <label htmlFor={inputId} className="block text-xs font-bold text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {isSelect ? (
        <select
          id={inputId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${baseInputStyles} cursor-pointer`}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1A1A1A] text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
      ) : isTextArea ? (
        <textarea
          id={inputId}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseInputStyles}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseInputStyles}
        />
      )}

      {helpText && !error && <p className="text-[11px] text-slate-400 mt-1">{helpText}</p>}
      {error && <p className="text-[11px] text-red-400 font-semibold mt-1">{error}</p>}
    </div>
  );
};
