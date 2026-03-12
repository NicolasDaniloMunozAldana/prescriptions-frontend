'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NutrabioticsLogo from '@/app/components/auth/NutrabioticsLogo';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  instructions: string | null;
}

interface FullPrescription {
  id: string;
  code: string;
  notes: string | null;
  status: 'pending' | 'consumed';
  createdAt: string;
  consumedAt: string | null;
  items: PrescriptionItem[];
  patient: {
    id: string;
    user: { id: string; name: string; email: string };
  };
  author: {
    specialty: string | null;
    user: { id: string; name: string; email: string };
  };
}

interface Props {
  id: string;
  role: 'doctor' | 'patient';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrescriptionDetailPage({ id, role }: Props) {
  const router = useRouter();
  const [prescription, setPrescription] = useState<FullPrescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [consuming, setConsuming] = useState(false);
  const [confirmConsume, setConfirmConsume] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const backHref = role === 'doctor' ? '/doctor' : '/dashboard';

  // ─── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchPrescription() {
      try {
        const res = await fetch(`/api/prescriptions/${id}`);
        if (res.status === 401) { router.replace('/auth/login'); return; }
        if (res.status === 404) { setNotFound(true); setIsLoading(false); return; }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { message?: string }).message ?? 'Error inesperado');
          setIsLoading(false);
          return;
        }
        setPrescription(await res.json());
      } catch {
        setError('Error de conexión con el servidor.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrescription();
  }, [id, router]);

  // ─── Consume ──────────────────────────────────────────────────────────────
  async function handleConsume() {
    setConsuming(true);
    setConfirmConsume(false);
    try {
      const res = await fetch(`/api/prescriptions/${id}/consume`, { method: 'PUT' });
      if (res.status === 401) { router.replace('/auth/login'); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Error al consumir');
        return;
      }
      setPrescription(await res.json());
    } finally {
      setConsuming(false);
    }
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────
  async function handleDownloadPDF() {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/prescriptions/${id}/pdf`);
      if (res.status === 401) { router.replace('/auth/login'); return; }
      if (!res.ok) { setError('Error al descargar el PDF.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescripcion-${prescription?.code ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingPdf(false);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // ─── Render states ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <NutrabioticsLogo />
          <Link
            href={backHref}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-white shadow-sm" />
            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-5 animate-pulse rounded bg-gray-100" style={{ width: `${60 + n * 8}%` }} />
              ))}
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-4 animate-pulse rounded bg-gray-100" style={{ width: `${50 + n * 10}%` }} />
              ))}
            </div>
          </div>
        )}

        {/* Not found */}
        {!isLoading && notFound && (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">Prescripción no encontrada</p>
            <p className="mt-2 text-sm text-gray-500">No existe esta prescripción o no tienes acceso.</p>
            <Link href={backHref} className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              Volver al inicio
            </Link>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && !prescription && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Content */}
        {!isLoading && prescription && (
          <div className="space-y-5">

            {/* Error banner (for action errors) */}
            {error && (
              <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Title row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Prescripción médica</p>
                <h1 className="mt-0.5 text-2xl font-bold text-gray-900">
                  #{prescription.code}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Emitida el {formatDate(prescription.createdAt)}
                </p>
              </div>
              <span className={`self-start sm:self-auto rounded-full px-4 py-1.5 text-sm font-semibold ${
                prescription.status === 'pending'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-green-50 text-green-700'
              }`}>
                {prescription.status === 'pending' ? 'Pendiente' : 'Consumida'}
              </span>
            </div>

            {/* Info grid */}
            <div className={`grid grid-cols-1 gap-4 ${role === 'doctor' ? 'sm:grid-cols-2' : ''}`}>

              {/* Doctor card */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Médico
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary select-none">
                    {prescription.author.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{prescription.author.user.name}</p>
                    {prescription.author.specialty && (
                      <p className="text-sm text-gray-500">{prescription.author.specialty}</p>
                    )}
                    <p className="text-xs text-gray-400">{prescription.author.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Patient card — only for doctor */}
              {role === 'doctor' && (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Paciente
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600 select-none">
                      {prescription.patient.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{prescription.patient.user.name}</p>
                      <p className="text-xs text-gray-400">{prescription.patient.user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {prescription.notes && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Notas
                </p>
                <p className="text-sm leading-relaxed text-gray-700">{prescription.notes}</p>
              </div>
            )}

            {/* Consumed date */}
            {prescription.consumedAt && (
              <div className="rounded-2xl bg-green-50 px-5 py-4">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">Consumida el</span>{' '}
                  {formatDate(prescription.consumedAt)}
                </p>
              </div>
            )}

            {/* Medications */}
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Medicamentos
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                    {prescription.items.length}
                  </span>
                </p>
              </div>

              {prescription.items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400">Sin medicamentos registrados.</p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Medicamento</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Dosis</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Cantidad</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Instrucciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {prescription.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-5 py-3.5 text-gray-400">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-medium text-gray-900">{item.name}</td>
                            <td className="px-5 py-3.5 text-gray-600">{item.dosage ?? <span className="text-gray-300">—</span>}</td>
                            <td className="px-5 py-3.5 text-gray-600">
                              {item.quantity != null ? item.quantity : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-3.5 text-gray-600">{item.instructions ?? <span className="text-gray-300">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="sm:hidden divide-y divide-gray-100">
                    {prescription.items.map((item, idx) => (
                      <div key={item.id} className="px-5 py-4 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{idx + 1}</span>
                        </div>
                        {item.dosage && (
                          <p className="text-sm text-gray-600">
                            <span className="text-gray-400">Dosis:</span> {item.dosage}
                          </p>
                        )}
                        {item.quantity != null && (
                          <p className="text-sm text-gray-600">
                            <span className="text-gray-400">Cantidad:</span> {item.quantity}
                          </p>
                        )}
                        {item.instructions && (
                          <p className="text-sm text-gray-600">
                            <span className="text-gray-400">Instrucciones:</span> {item.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {role === 'patient' && prescription.status === 'pending' && (
                <button
                  onClick={() => setConfirmConsume(true)}
                  disabled={consuming}
                  className="flex-1 rounded-xl border border-primary py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {consuming ? 'Procesando…' : 'Marcar como consumida'}
                </button>
              )}
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {downloadingPdf ? 'Generando PDF…' : 'Descargar PDF'}
              </button>
            </div>

          </div>
        )}
      </main>

      {/* Confirm consume dialog */}
      {confirmConsume && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-consume-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="confirm-consume-title" className="text-base font-bold text-gray-900">
              Confirmar consumo
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              ¿Estás seguro de que deseas marcar esta prescripción como consumida?
              Esta acción no puede deshacerse.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmConsume(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConsume}
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
