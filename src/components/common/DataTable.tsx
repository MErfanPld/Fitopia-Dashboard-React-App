import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  initialPageSize?: number;
  actions?: (row: T) => React.ReactNode;
  filterComponent?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  searchPlaceholder = 'جستجو در جدول...',
  searchKeys = [],
  initialPageSize = 8,
  actions,
  filterComponent,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 1. Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const query = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = item[key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(query);
        });
      }
      // Default search in all string/number fields
      return Object.values(item as Record<string, unknown>).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(query)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal, 'fa') : bVal.localeCompare(aVal, 'fa');
      }

      return sortOrder === 'asc'
        ? (aVal as number) > (bVal as number)
          ? 1
          : -1
        : (aVal as number) < (bVal as number)
        ? 1
        : -1;
    });
  }, [filteredData, sortKey, sortOrder]);

  // 3. Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl overflow-hidden shadow-lg">
      {/* Search & Filters Header Bar */}
      <div className="p-3.5 sm:p-4 border-b border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141414]">
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#1F1F1F] border border-[#2E2E2E] text-slate-200 placeholder-slate-500 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A]"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>

        {filterComponent && <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">{filterComponent}</div>}
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700">
        <table className="w-full text-right border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-[#161616] border-b border-[#262626] text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className="px-3.5 sm:px-4 py-3.5 whitespace-nowrap">
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{col.header}</span>
                      {sortKey === col.key ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#FF7A1A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#FF7A1A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              ))}
              {actions && <th className="px-3.5 sm:px-4 py-3.5 text-center whitespace-nowrap">عملیات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242424] text-xs text-slate-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-[#202020] transition-colors group">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3.5 sm:px-4 py-3.5 align-middle">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-3.5 sm:px-4 py-3.5 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-slate-500">
                  اطلاعاتی متناسب با جستجوی شما یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-400 bg-[#141414]">
        <div className="flex items-center gap-2">
          <span>تعداد ردیف در صفحه:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#1F1F1F] border border-[#2E2E2E] text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7A1A]"
          >
            <option value={5}>۵</option>
            <option value={8}>۸</option>
            <option value={15}>۱۵</option>
            <option value={30}>۳۰</option>
          </select>
          <span className="text-[11px] text-slate-500 mr-2">
            نمایش {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} تا{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} از {sortedData.length} مورد
          </span>
        </div>

        {/* RTL Pagination Buttons (Note: In RTL, ChevronRight goes Next and ChevronLeft goes Prev or vice versa, let's keep exact Persian labels) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-[#2E2E2E] bg-[#1F1F1F] text-slate-300 hover:bg-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="صفحه قبلی"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-bold text-white bg-[#222] rounded-lg border border-[#333]">
            صفحه {currentPage} از {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-[#2E2E2E] bg-[#1F1F1F] text-slate-300 hover:bg-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="صفحه بعدی"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
