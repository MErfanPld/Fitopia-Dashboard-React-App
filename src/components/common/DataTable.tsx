import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T) => string | number;
  emptyMessage?: string;
  searchKeys?: string[];
  actions?: (row: T) => React.ReactNode;
  searchPlaceholder?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'موردی یافت نشد',
  searchKeys,
  actions,
  searchPlaceholder = 'جستجو...',
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchKeys?.length || !query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const val = (row as Record<string, unknown>)[key];
        return val != null && String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, query, searchKeys]);

  const getKey = (row: T, index: number) => {
    if (rowKey) return rowKey(row);
    const rec = row as Record<string, unknown>;
    if (rec && typeof rec === 'object' && rec.id != null) return String(rec.id);
    return index;
  };

  return (
    <div className="space-y-3">
      {searchKeys && searchKeys.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-border bg-input pr-10 pl-3 py-2.5 text-sm text-ink
              placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-input-focus transition-colors duration-200"
          />
        </div>
      )}

      {!filtered.length ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--fitopia-shadow)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-header border-b border-border">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-xs font-bold text-muted whitespace-nowrap ${col.className || ''}`}
                    >
                      {col.header}
                    </th>
                  ))}
                  {actions && (
                    <th className="px-4 py-3 text-xs font-bold text-muted whitespace-nowrap">عملیات</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr
                    key={getKey(row, index)}
                    className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors duration-150"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-ink whitespace-nowrap ${col.className || ''}`}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">{actions(row)}</div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
