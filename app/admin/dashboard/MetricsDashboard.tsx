'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthError, getMetrics, type Metrics } from '@/lib/admin.service';

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  accentClass,
  sub,
}: {
  label: string;
  value: number;
  accentClass: string;
  sub?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className={`h-1 ${accentClass}`} />
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {value.toLocaleString('es-ES')}
        </p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────

function DonutChart({ pending, consumed }: { pending: number; consumed: number }) {
  const total = pending + consumed;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Sin datos en el período
      </div>
    );
  }

  const cx = 80;
  const cy = 80;
  const R = 62;
  const r = 38;

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(startDeg: number, endDeg: number) {
    // Clamp to avoid full-circle path bug
    const clampedEnd = endDeg >= 360 ? 359.999 : endDeg;
    const outer1 = polarToXY(startDeg, R);
    const outer2 = polarToXY(clampedEnd, R);
    const inner1 = polarToXY(clampedEnd, r);
    const inner2 = polarToXY(startDeg, r);
    const large = clampedEnd - startDeg > 180 ? 1 : 0;
    return [
      `M ${outer1.x} ${outer1.y}`,
      `A ${R} ${R} 0 ${large} 1 ${outer2.x} ${outer2.y}`,
      `L ${inner1.x} ${inner1.y}`,
      `A ${r} ${r} 0 ${large} 0 ${inner2.x} ${inner2.y}`,
      'Z',
    ].join(' ');
  }

  const pendingDeg = (pending / total) * 360;

  const pendingPct = ((pending / total) * 100).toFixed(1);
  const consumedPct = ((consumed / total) * 100).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={160} height={160} viewBox="0 0 160 160">
        {/* Pending segment */}
        <path d={arcPath(0, pendingDeg)} fill="#0098D0" />
        {/* Consumed segment */}
        <path d={arcPath(pendingDeg, 360)} fill="#22c55e" />
        {/* Center label */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill="#111827"
        >
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">
          total
        </text>
      </svg>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 shrink-0 rounded-full bg-primary" />
          <span className="text-gray-600">
            Pendientes —{' '}
            <span className="font-semibold text-gray-900">
              {pending} ({pendingPct}%)
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 shrink-0 rounded-full bg-green-500" />
          <span className="text-gray-600">
            Consumidas —{' '}
            <span className="font-semibold text-gray-900">
              {consumed} ({consumedPct}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-gray-400">
        Sin prescripciones en el período seleccionado
      </p>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartH = 130;
  const minBarW = 20;
  const maxBarW = 36;
  const gap = Math.min(maxBarW + 12, Math.floor(500 / data.length));
  const barW = Math.min(maxBarW, Math.max(minBarW, gap - 8));
  const totalW = Math.max(data.length * gap + 20, 300);

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalW}
        height={chartH + 36}
        className="min-w-full"
        style={{ minWidth: `${Math.min(totalW, 300)}px` }}
      >
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartH - ratio * chartH;
          return (
            <line
              key={ratio}
              x1={0}
              y1={y}
              x2={totalW}
              y2={y}
              stroke="#f3f4f6"
              strokeWidth={1}
            />
          );
        })}

        {data.map((d, idx) => {
          const barH = Math.max(4, (d.count / maxCount) * chartH);
          const x = idx * gap + (gap - barW) / 2;
          const y = chartH - barH;
          const label = d.date.slice(5); // MM-DD

          return (
            <g key={d.date}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill="#0098D0"
                fillOpacity={0.85}
              />
              {/* Count above bar */}
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize={9}
                fill="#374151"
                fontWeight={600}
              >
                {d.count}
              </text>
              {/* Date label */}
              <text
                x={x + barW / 2}
                y={chartH + 16}
                textAnchor="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function MetricsDashboard() {
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [appliedFrom, setAppliedFrom] = useState(thirtyDaysAgo);
  const [appliedTo, setAppliedTo] = useState(today);

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = useCallback(
    async (f: string, t: string) => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getMetrics({ from: f, to: t });
        setMetrics(data);
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

  useEffect(() => {
    fetchMetrics(appliedFrom, appliedTo);
  }, [fetchMetrics, appliedFrom, appliedTo]);

  function handleApply() {
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  const pending = metrics?.byStatus?.pending ?? 0;
  const consumed = metrics?.byStatus?.consumed ?? 0;
  const total = metrics?.totals.prescriptions ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Resumen de actividad del sistema
        </p>
      </div>

      {/* ── Date filter ── */}
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
        <button
          onClick={handleApply}
          disabled={isLoading}
          className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Cargando…' : 'Aplicar filtro'}
        </button>
        {isLoading && (
          <span className="self-center text-xs text-gray-400">Actualizando…</span>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── KPI skeleton ── */}
      {isLoading && !metrics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="h-1 animate-pulse bg-gray-100" />
              <div className="space-y-2 p-5">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-8 w-14 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Data ── */}
      {metrics && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <KpiCard
              label="Médicos"
              value={metrics.totals.doctors}
              accentClass="bg-primary"
            />
            <KpiCard
              label="Pacientes"
              value={metrics.totals.patients}
              accentClass="bg-indigo-500"
            />
            <KpiCard
              label="Prescripciones"
              value={total}
              accentClass="bg-gray-400"
              sub="en el período"
            />
            <KpiCard
              label="Pendientes"
              value={pending}
              accentClass="bg-blue-400"
            />
            <KpiCard
              label="Consumidas"
              value={consumed}
              accentClass="bg-green-500"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Donut — status distribution */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-gray-900">Estado de Prescripciones</h2>
              <DonutChart pending={pending} consumed={consumed} />
            </div>

            {/* Bar chart — by day */}
            <div className="col-span-1 rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-bold text-gray-900">Prescripciones por Día</h2>
                <span className="text-xs text-gray-400">
                  {metrics.byDay.length} día{metrics.byDay.length !== 1 ? 's' : ''} con
                  actividad
                </span>
              </div>
              <BarChart data={metrics.byDay} />
            </div>
          </div>

          {/* Top doctors */}
          {metrics.topDoctors.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-bold text-gray-900">Top Médicos por Prescripciones</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Médicos con mayor actividad en el período
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {metrics.topDoctors.map((d, idx) => {
                  const maxCount = metrics.topDoctors[0].count;
                  const widthPct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div
                      key={d.doctorId}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                          idx === 0
                            ? 'bg-primary'
                            : idx === 1
                              ? 'bg-indigo-400'
                              : idx === 2
                                ? 'bg-gray-400'
                                : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <code className="truncate text-xs text-gray-500">
                            {d.doctorId}
                          </code>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {d.count} rx
                          </span>
                        </div>
                        {/* progress bar */}
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-primary/60 transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
