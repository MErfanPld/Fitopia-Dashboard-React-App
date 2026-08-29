import React, { useEffect, useRef, useState } from 'react';
import { Filter, X } from 'lucide-react';

export type FilterOption = { value: string; label: string };

export type FilterField = {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
};

export interface FilterPopoverProps {
  fields: FilterField[];
  activeCount: number;
  onClear: () => void;
  /** Optional: format badge number (e.g. Persian digits) */
  formatCount?: (n: number) => string;
  title?: string;
}

/**
 * Unified filter button + popup used across dashboard list pages (same UX as Members).
 */
export const FilterPopover: React.FC<FilterPopoverProps> = ({
  fields,
  activeCount,
  onClear,
  formatCount,
  title = 'فیلترها',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const badge = formatCount ? formatCount(activeCount) : String(activeCount);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${
          activeCount > 0
            ? 'border-primary bg-primary-soft text-primary'
            : 'border-border text-secondary hover:bg-surface-hover'
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Filter className="w-4 h-4" />
        فیلترها
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-fg text-[11px] font-bold">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={title}
          className="absolute left-0 top-full mt-2 z-40 w-[min(100vw-2rem,20rem)] rounded-2xl border border-border bg-surface shadow-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-muted hover:bg-surface-hover"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">{field.label}</label>
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
              >
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClear();
              }}
              disabled={activeCount === 0}
              className="text-xs text-muted hover:text-ink disabled:opacity-40"
            >
              پاک کردن فیلترها
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-fg font-bold"
            >
              اعمال
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPopover;
