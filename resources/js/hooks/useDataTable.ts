import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
  lastPage: number;
}

interface Options {
  defaultSort?: string;
  defaultDir?: "asc" | "desc";
  defaultPerPage?: number;
  /** Filter tambahan, contoh: { role: "admin" } */
  params?: Record<string, unknown>;
}

/**
 * State + fetch untuk datatable server-side (Laravel paginate()).
 * Search di-debounce, request lama yang terlambat diabaikan.
 */
export default function useDataTable<T>(endpoint: string, options: Options = {}) {
  const { defaultSort = "created_at", defaultDir = "desc", defaultPerPage = 10, params } = options;

  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1, perPage: defaultPerPage, total: 0, from: 0, to: 0, lastPage: 1,
  });
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(defaultPerPage);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(defaultSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultDir);

  const requestId = useRef(0);
  const paramsKey = JSON.stringify(params ?? {});

  // Debounce pencarian 400 ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Ganti filter -> kembali ke halaman 1
  useEffect(() => {
    setPage(1);
  }, [paramsKey]);

  const fetchData = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const { data } = await api.get(endpoint, {
        params: {
          page,
          per_page: perPage,
          search: search || undefined,
          sort_by: sortBy,
          sort_dir: sortDir,
          ...JSON.parse(paramsKey),
        },
      });
      if (id !== requestId.current) return; // ada request yang lebih baru

      // Halaman terakhir kosong (mis. setelah hapus data) -> mundur
      if (data.data.length === 0 && page > 1) {
        setPage(Math.max(data.last_page, 1));
        return;
      }

      setRows(data.data);
      setMeta({
        page: data.current_page,
        perPage: Number(data.per_page),
        total: data.total,
        from: data.from ?? 0,
        to: data.to ?? 0,
        lastPage: data.last_page,
      });
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [endpoint, page, perPage, search, sortBy, sortDir, paramsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const setPerPage = (n: number) => {
    setPerPageState(n);
    setPage(1);
  };

  return {
    rows, meta, loading,
    searchInput, setSearchInput,
    sortBy, sortDir, toggleSort,
    setPage, setPerPage,
    refresh: fetchData,
  };
}
