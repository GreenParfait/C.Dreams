import { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import DataTable, { type Column } from "@/components/datatable/DataTable";
import useDataTable from "@/hooks/useDataTable";
import api from "@/lib/api";
import UserFormModal from "./UserFormModal";
import type { Role, User } from "./types";

const roleBadge: Record<string, string> = {
  superadmin: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
  admin: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  pembeli: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
};

export default function UserList() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const table = useDataTable<User>("/users", {
    params: roleFilter ? { role: roleFilter } : {},
  });

  useEffect(() => {
    api.get("/roles").then(({ data }) => setRoles(data));
  }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setModalOpen(true); };

  const handleDelete = async (u: User) => {
    if (!confirm(`Hapus user "${u.name}"?`)) return;
    try {
      await api.delete(`/users/${u.uuid}`);
      table.refresh();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Gagal menghapus user");
    }
  };

  const columns: Column<User>[] = [
    {
      key: "no",
      header: "No",
      className: "w-16",
      render: (_, i) => table.meta.from + i,
    },
    {
      key: "name",
      header: "Nama",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-500 dark:bg-brand-500/15">
            {u.name.charAt(0).toUpperCase()}
          </span>
          <span className="font-medium text-gray-800 dark:text-white/90">{u.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", sortable: true },
    {
      key: "role",
      header: "Role",
      render: (u) =>
        u.role ? (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[u.role.slug] ?? "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-400"}`}>
            {u.role.name}
          </span>
        ) : "-",
    },
    {
      key: "created_at",
      header: "Dibuat",
      sortable: true,
      render: (u) => new Date(u.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (u) => (
        <div className="flex justify-end gap-3">
          <button onClick={() => openEdit(u)} className="text-brand-500 hover:underline">Edit</button>
          <button onClick={() => handleDelete(u)} className="text-error-500 hover:underline">Hapus</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Users | Dashboard" description="Manajemen user" />
      <PageBreadCrumb pageTitle="Users" />

      <DataTable<User>
        columns={columns}
        rows={table.rows}
        rowKey={(u) => u.uuid}
        loading={table.loading}
        meta={table.meta}
        searchValue={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Cari nama atau email..."
        sortBy={table.sortBy}
        sortDir={table.sortDir}
        onSort={table.toggleSort}
        onPageChange={table.setPage}
        onPerPageChange={table.setPerPage}
        toolbar={
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Semua role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.slug}>{r.name}</option>
              ))}
            </select>
            <button
              onClick={openCreate}
              className="inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              Tambah user
            </button>
          </div>
        }
      />

      <UserFormModal
        open={modalOpen}
        user={editing}
        roles={roles}
        onClose={() => setModalOpen(false)}
        onSaved={table.refresh}
      />
    </>
  );
}
