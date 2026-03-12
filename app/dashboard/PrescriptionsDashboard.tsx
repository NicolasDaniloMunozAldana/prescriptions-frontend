'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NutrabioticsLogo from '@/app/components/auth/NutrabioticsLogo';
import {
  getProfile,
  getPrescriptions,
  consumePrescription,
  downloadPrescriptionPDF,
  logout,
  AuthError,
  type UserProfile,
  type Prescription,
  type PrescriptionMeta,
  type StatusFilter,
} from '@/lib/prescriptions.service';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'consumed', label: 'Consumidas' },
];

export default function PrescriptionsDashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [meta, setMeta] = useState<PrescriptionMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [consumingId, setConsumingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Load profile once on mount ──────────────────────────────────────────
  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => router.replace('/auth/login'));
  }, [router]);

  // ─── Load prescriptions ───────────────────────────────────────────────────
  const loadPrescriptions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getPrescriptions({
        page,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      });
      setPrescriptions(data.data);
      setMeta(data.meta);
    } catch (err) {
      if (err instanceof AuthError) {
        router.replace('/auth/login');
        return;
      }
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, router]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  // ─── Filter change ────────────────────────────────────────────────────────
  function changeFilter(filter: StatusFilter) {
    setStatusFilter(filter);
    setPage(1);
  }

  // ─── Consume ──────────────────────────────────────────────────────────────
  async function handleConsume(id: string) {
    setConsumingId(id);
    setConfirmId(null);
    try {
      const updated = await consumePrescription(id);
      setPrescriptions((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      if (err instanceof AuthError) {
        router.replace('/auth/login');
        return;
      }
      setError((err as Error).message);
    } finally {
      setConsumingId(null);
    }
  }

  // ─── Download PDF ─────────────────────────────────────────────────────────
  async function handleDownloadPDF(id: string, code: string) {
    setDownloadingId(id);
    try {
      const blob = await downloadPrescriptionPDF(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescripcion-${code}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof AuthError) {
        router.replace('/auth/login');
        return;
      }
      setError((err as Error).message);
    } finally {
      setDownloadingId(null);
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace('/auth/login');
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── Navigation bar ── */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <NutrabioticsLogo />

          {profile && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white select-none"
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium text-gray-700 sm:block">
                  {profile.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                {loggingOut ? 'Saliendo…' : 'Cerrar sesión'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Prescripciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consulta y gestiona tus prescripciones médicas
          </p>
        </div>

        {/* Status filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => changeFilter(value)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition cursor-pointer ${
                statusFilter === value
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
            <p className="text-gray-400">No tienes prescripciones en esta categoría.</p>
          </div>
        ) : (
          <>
            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {prescriptions.map((rx) => (
                <article
                  key={rx.id}
                  className="flex flex-col rounded-2xl bg-white p-6 shadow-sm"
                >
                  {/* Status badge + code */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        rx.status === 'pending'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {rx.status === 'pending' ? 'Pendiente' : 'Consumida'}
                    </span>
                    <span className="font-mono text-xs text-gray-400">#{rx.code}</span>
                  </div>

                  {/* Issue date */}
                  <div className="mt-4">
                    <p className="text-xs text-gray-400">Fecha de emisión</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800">
                      {formatDate(rx.createdAt)}
                    </p>
                  </div>

                  {/* Doctor */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-400">Doctor</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-800">
                      {rx.author.user.name}
                    </p>
                    {rx.author.specialty && (
                      <p className="text-xs text-gray-500">{rx.author.specialty}</p>
                    )}
                  </div>

                  {/* Medications */}
                  {rx.items.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400">Medicamentos</p>
                      <ul className="mt-0.5 space-y-0.5">
                        {rx.items.slice(0, 2).map((item) => (
                          <li key={item.id} className="text-sm text-gray-700">
                            — {item.name}
                          </li>
                        ))}
                        {rx.items.length > 2 && (
                          <li className="text-xs text-gray-400">
                            +{rx.items.length - 2} más
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Notes */}
                  {rx.notes && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400">Notas</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{rx.notes}</p>
                    </div>
                  )}

                  {/* Consumed date */}
                  {rx.consumedAt && (
                    <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400">
                      Consumida el {formatDate(rx.consumedAt)}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex flex-col gap-2 border-t border-gray-100 pt-4">
                    {rx.status === 'pending' && (
                      <button
                        onClick={() => setConfirmId(rx.id)}
                        disabled={consumingId === rx.id}
                        className="w-full rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        {consumingId === rx.id ? 'Procesando…' : 'Marcar como consumida'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPDF(rx.id, rx.code)}
                      disabled={downloadingId === rx.id}
                      className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {downloadingId === rx.id ? 'Descargando…' : 'Descargar PDF'}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {page} de {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Confirm consume dialog ── */}
      {confirmId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="confirm-dialog-title" className="text-base font-bold text-gray-900">
              Confirmar consumo
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              ¿Estás seguro de que deseas marcar esta prescripción como consumida?
              Esta acción no puede deshacerse.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConsume(confirmId)}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
