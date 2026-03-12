'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthError,
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserRecord,
  type UserRole,
} from '@/lib/admin.service';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  patient: 'Paciente',
};

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  doctor: 'bg-primary/10 text-primary',
  patient: 'bg-green-100 text-green-700',
};

const ROLE_AVATAR_CLASS: Record<UserRole, string> = {
  admin: 'bg-purple-500',
  doctor: 'bg-primary',
  patient: 'bg-gray-400',
};

// ─── User Form Modal ───────────────────────────────────────────────────────────

interface UserFormProps {
  mode: 'create' | 'edit';
  initial?: UserRecord;
  onClose: () => void;
  onSuccess: (user: UserRecord) => void;
}

function UserFormModal({ mode, initial, onClose, onSuccess }: UserFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(initial?.role ?? 'patient');
  const [specialty, setSpecialty] = useState(initial?.doctor?.specialty ?? '');
  const [birthDate, setBirthDate] = useState(
    initial?.patient?.birthDate
      ? new Date(initial.patient.birthDate).toISOString().split('T')[0]
      : '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveRole = mode === 'edit' ? initial?.role ?? role : role;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let result: UserRecord;
      if (mode === 'create') {
        const payload: CreateUserPayload = { email, password, name, role };
        if (role === 'doctor' && specialty) payload.specialty = specialty;
        if (role === 'patient' && birthDate) payload.birthDate = birthDate;
        result = await createUser(payload);
      } else {
        const payload: UpdateUserPayload = {};
        if (name !== initial?.name) payload.name = name;
        if (initial?.role === 'doctor') payload.specialty = specialty || undefined;
        if (initial?.role === 'patient' && birthDate) payload.birthDate = birthDate;
        result = await updateUser(initial!.id, payload);
      }
      onSuccess(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-base font-bold text-gray-900">
          {mode === 'create' ? 'Crear nuevo usuario' : 'Editar usuario'}
        </h2>

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Email — create only */}
          {mode === 'create' && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </div>
          )}

          {/* Password — create only */}
          {mode === 'create' && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </div>
          )}

          {/* Role — create only */}
          {mode === 'create' && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none disabled:opacity-50"
              >
                <option value="patient">Paciente</option>
                <option value="doctor">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          )}

          {/* Specialty — doctor only */}
          {effectiveRole === 'doctor' && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Especialidad
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                disabled={loading}
                placeholder="Ej: Cardiología"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </div>
          )}

          {/* Birth date — patient only */}
          {effectiveRole === 'patient' && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Guardando…' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({
  user,
  loading,
  onConfirm,
  onClose,
}: {
  user: UserRecord;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900">Eliminar usuario</h3>
        <p className="mt-2 text-sm text-gray-500">
          ¿Estás seguro de eliminar a{' '}
          <span className="font-semibold text-gray-700">{user.name}</span>? Esta
          acción no puede deshacerse y eliminará todas las prescripciones
          asociadas en cascada.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 cursor-pointer rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UsersManager() {
  const router = useRouter();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Filters ──
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [page, setPage] = useState(1);

  // ── Modals ──
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(
    async (p: number, q: string, r: UserRole | 'all') => {
      setIsLoading(true);
      setError('');
      try {
        const resp = await getUsers({
          page: p,
          limit: 15,
          query: q || undefined,
          role: r === 'all' ? undefined : r,
        });
        setUsers(resp.data);
        setMeta(resp.meta);
      } catch (err) {
        if (err instanceof AuthError) {
          router.replace('/auth/login');
          return;
        }
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // Debounced fetch on filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(page, search, roleFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers, page, search, roleFilter]);

  function handleCreateSuccess() {
    setShowCreate(false);
    setPage(1);
    fetchUsers(1, search, roleFilter);
  }

  function handleEditSuccess(updated: UserRecord) {
    setEditTarget(null);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchUsers(nextPage, search, roleFilter);
    } catch (err) {
      if (err instanceof AuthError) {
        router.replace('/auth/login');
        return;
      }
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function profileInfo(user: UserRecord): React.ReactNode {
    if (user.role === 'doctor') {
      return user.doctor?.specialty ? (
        <span>{user.doctor.specialty}</span>
      ) : (
        <span className="text-gray-300">Sin especialidad</span>
      );
    }
    if (user.role === 'patient') {
      return user.patient?.birthDate ? (
        <span>{formatDate(user.patient.birthDate)}</span>
      ) : (
        <span className="text-gray-300">Sin fecha de nac.</span>
      );
    }
    return <span className="text-gray-300">—</span>;
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Gestión de usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-48 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | 'all');
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
        >
          <option value="all">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="doctor">Médico</option>
          <option value="patient">Paciente</option>
        </select>
        <p className="shrink-0 self-center text-xs text-gray-400">
          {meta.total} resultado{meta.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {isLoading ? (
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="flex items-center gap-4 border-b border-gray-50 px-5 py-4"
              >
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-56 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            No hay usuarios que coincidan con los filtros aplicados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Usuario
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Rol
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:table-cell">
                    Perfil
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 md:table-cell">
                    Creado
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold text-white ${ROLE_AVATAR_CLASS[user.role]}`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE_CLASS[user.role]}`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 text-sm text-gray-500 sm:table-cell">
                      {profileInfo(user)}
                    </td>
                    <td className="hidden px-5 py-3.5 text-sm text-gray-500 md:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(user)}
                          className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Página {meta.page} de {meta.totalPages} · {meta.total} usuarios
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || isLoading}
              className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages || isLoading}
              className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreate && (
        <UserFormModal mode="create" onClose={() => setShowCreate(false)} onSuccess={handleCreateSuccess} />
      )}
      {editTarget && (
        <UserFormModal
          mode="edit"
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={handleEditSuccess}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmDialog
          user={deleteTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
