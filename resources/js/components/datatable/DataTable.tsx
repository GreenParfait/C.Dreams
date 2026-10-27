import type { ReactNode } from "react";
import type { PaginationMeta } from "@/hooks/useDataTable";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading: boolean;
  meta: PaginationMeta;

  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;

  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];

  /** Area kanan atas: tombol tambah, filter, dll. */
  toolbar?: ReactNode;
  emptyText?: string;
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  const on = "text-brand-500";
  const off = "text-gray-300 dark:text-gray-600";
  return (
    <span className="ml-1.5 inline-flex flex-col leading-none">
      <svg width="8" height="5" viewBox="0 0 8 5" className={active && dir === "asc" ? on : off} fill="currentColor">
        <path d="M4 0l4 5H0z" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" className={`mt-0.5 ${active && dir === "desc" ? on : off}`} fill="currentColor">
        <path d="M4 5L0 0h8z" />
      </svg>
    </span>
  );
}

function getPages(current: number, last: number): (number | "...")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < last - 1) pages.push("...");
  pages.push(last);
  return pages;
}

const selectClass =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 " +
  "focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function DataTable<T>({
  columns, rows, rowKey, loading, meta,
  searchValue, onSearchChange, searchPlaceholder = "Cari...",
  sortBy, sortDir, onSort,
  onPageChange, onPerPageChange, perPageOptions = [10, 25, 50, 100],
  toolbar, emptyText = "Tidak ada data",
}: DataTableProps<T>) {
  const pages = getPages(meta.page, meta.lastPage);
  const firstLoad = loading && rows.length === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Bar atas: jumlah per halaman, pencarian, aksi */}
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Tampilkan</span>
          <select
            className={selectClass}
            value={meta.perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>data</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M9 15.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM17.5 17.5l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:w-64"
            />
          </div>
          {toolbar}
        </div>
      </div>

      {/* Tabel */}
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
            <tr>
              {columns.map((col) => {
                const active = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                    className={`px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 ${col.className ?? ""}`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center hover:text-gray-800 dark:hover:text-white/90"
                      >
                        {col.header}
                        <SortIcon active={active} dir={sortDir} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className={`divide-y divide-gray-100 text-gray-700 transition-opacity dark:divide-gray-800 dark:text-gray-400 ${loading && !firstLoad ? "opacity-50" : ""}`}>
            {firstLoad &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-4">
                      <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                  ))}
                </tr>
              ))}

            {!firstLoad && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                  {emptyText}
                </td>
              </tr>
            )}

            {rows.map((row, i) => (
              <tr key={rowKey(row)} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                {columns.map((col) => (
                  <td key={col.key} className={`px-5 py-3.5 ${col.className ?? ""}`}>
                    {col.render ? col.render(row, i) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar bawah: info + pagination */}
      <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {meta.from} sampai {meta.to} dari {meta.total} data
        </p>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            Sebelumnya
          </button>

          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-gray-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === meta.page ? "page" : undefined}
                className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium ${
                  p === meta.page
                    ? "bg-brand-500 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            disabled={meta.page >= meta.lastPage}
            onClick={() => onPageChange(meta.page + 1)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            Berikutnya
          </button>
        </nav>
      </div>
    </div>
  );
}
