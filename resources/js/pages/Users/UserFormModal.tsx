import { useEffect, useState, type FormEvent } from "react";
import api from "@/lib/api";
import type { Role, User } from "./types";

interface Props {
  open: boolean;
  user: User | null;     // null = tambah, ada isi = edit
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role_id: string;
}

const emptyForm: FormState = { name: "", email: "", password: "", role_id: "" };

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 " +
  "placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";

export default function UserFormModal({ open, user, roles, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      user
        ? { name: user.name, email: user.email, password: "", role_id: String(user.role_id) }
        : emptyForm
    );
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (user) {
        await api.put(`/users/${user.uuid}`, form);
      } else {
        await api.post("/users", form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message ?? "Terjadi kesalahan, coba lagi");
      }
    } finally {
      setSaving(false);
    }
  };

  const err = (name: string) =>
    errors[name] && <p className="mt-1 text-xs text-error-500">{errors[name][0]}</p>;

  return (
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          {user ? "Edit user" : "Tambah user"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nama</label>
            <input className={inputClass} value={form.name} onChange={set("name")} placeholder="Nama lengkap" />
            {err("name")}
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.email} onChange={set("email")} placeholder="nama@email.com" />
            {err("email")}
          </div>

          <div>
            <label className={labelClass}>Role</label>
            <select className={inputClass} value={form.role_id} onChange={set("role_id")}>
              <option value="">Pilih role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {err("role_id")}
          </div>

          <div>
            <label className={labelClass}>
              Password {user && <span className="text-xs font-normal">(kosongkan jika tidak diubah)</span>}
            </label>
            <input type="password" className={inputClass} value={form.password} onChange={set("password")} placeholder="Minimal 8 karakter" />
            {err("password")}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-gray-300 px-5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
