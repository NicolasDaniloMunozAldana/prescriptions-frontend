'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthError } from '@/lib/admin.service';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Status = 'pending' | 'consumed';

interface PrescriptionRow {
    id: string;
    code: string;
    status: Status;
    createdAt: string;
    consumedAt: string | null;
    author: { specialty: string | null; user: { name: string } };
    patient: { user: { name: string; email: string } };
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminPrescriptions() {
    const router = useRouter();

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
    const [from, setFrom] = useState(thirtyDaysAgo);
    const [to, setTo] = useState(today);
    const [appliedFrom, setAppliedFrom] = useState(thirtyDaysAgo);
    const [appliedTo, setAppliedTo] = useState(today);
    const [page, setPage] = useState(1);

    const fetchData = useCallback(
        async (p: number, status: Status | 'all', f: string, t: string) => {
            setIsLoading(true);
            setError('');
            try {
                const qs = new URLSearchParams({ page: String(p), limit: '10', from: f, to: t });
                if (status !== 'all') qs.set('status', status);

                const res = await fetch(`/api/admin/prescriptions?${qs}`);
                if (res.status === 401) { router.replace('/auth/login'); return; }
                const data = await res.json();
                if (!res.ok) throw new Error(data.message ?? 'Error inesperado');
                setPrescriptions(data.data);
                setMeta(data.meta);
            } catch (err) {
                if (err instanceof AuthError) { router.replace('/auth/login'); return; }
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        },
        [router],
    );

    useEffect(() => {
        fetchData(page, statusFilter, appliedFrom, appliedTo);
    }, [fetchData, page, statusFilter, appliedFrom, appliedTo]);

    function handleApply() {
        setPage(1);
        setAppliedFrom(from);
        setAppliedTo(to);
    }

    function handleClear() {
        setFrom(thirtyDaysAgo);
        setTo(today);
        setAppliedFrom(thirtyDaysAgo);
        setAppliedTo(today);
        setStatusFilter('all');
        setPage(1);
    }

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Prescripciones</h1>
                <p className="mt-0.5 text-sm text-gray-500">
                    Listado completo de todas las prescripciones del sistema
                </p>
            </div>

            {/* ── Error ── */}
            {error && (
                <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        Desde
                    </label>
                    <input
                        type="date"
                        value={from}
                        max={to}
                        onChange={(e) => setFrom(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        Hasta
                    </label>
                    <input
                        type="date"
                        value={to}
                        min={from}
                        onChange={(e) => setTo(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        Estado
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as Status | 'all');
                            setPage(1);
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                    >
                        <option value="all">Todos</option>
                        <option value="pending">Pendiente</option>
                        <option value="consumed">Consumida</option>
                    </select>
                </div>
                <div className="flex items-end gap-2">
                    <button
                        onClick={handleApply}
                        disabled={isLoading}
                        className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isLoading ? 'Cargando…' : 'Aplicar'}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={isLoading}
                        className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        Limpiar
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="h-[17px]" />
                    <p className="flex h-10 items-center text-xs text-gray-400">
                        {meta.total} resultado{meta.total !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {isLoading ? (
                    <div>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="flex items-center gap-4 border-b border-gray-50 px-5 py-4">
                                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                                </div>
                                <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
                            </div>
                        ))}
                    </div>
                ) : prescriptions.length === 0 ? (
                    <p className="px-5 py-14 text-center text-sm text-gray-400">
                        No hay prescripciones en el período seleccionado
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                        Código
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                        Paciente
                                    </th>
                                    <th className="hidden px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:table-cell">
                                        Médico
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                        Estado
                                    </th>
                                    <th className="hidden px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 md:table-cell">
                                        Emitida
                                    </th>
                                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                        Detalle
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {prescriptions.map((rx) => (
                                    <tr key={rx.id} className="transition-colors hover:bg-gray-50/60">
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-xs font-semibold text-gray-700">
                                                {rx.code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-gray-900">{rx.patient.user.name}</p>
                                            <p className="text-xs text-gray-400">{rx.patient.user.email}</p>
                                        </td>
                                        <td className="hidden px-5 py-3.5 sm:table-cell">
                                            <p className="text-gray-700">{rx.author.user.name}</p>
                                            {rx.author.specialty && (
                                                <p className="text-xs text-gray-400">{rx.author.specialty}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rx.status === 'pending'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {rx.status === 'pending' ? 'Pendiente' : 'Consumida'}
                                            </span>
                                        </td>
                                        <td className="hidden px-5 py-3.5 text-sm text-gray-500 md:table-cell">
                                            {formatDate(rx.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Link
                                                href={`/admin/prescriptions/${rx.id}`}
                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                                            >
                                                Ver
                                            </Link>
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
                        Página {meta.page} de {meta.totalPages} · {meta.total} prescripciones
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
        </div>
    );
}
