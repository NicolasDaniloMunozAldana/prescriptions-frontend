'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  createPrescription,
  searchPatients,
  AuthError,
  type CreatePrescriptionItemPayload,
  type PatientResult,
} from '@/lib/doctor.service';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface ItemForm {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

const EMPTY_ITEM: ItemForm = {
  name: '',
  dosage: '',
  quantity: '',
  instructions: '',
};

export default function CreatePrescriptionModal({ onClose, onCreated }: Props) {
  const [patientQuery, setPatientQuery] = useState('');
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemForm[]>([{ ...EMPTY_ITEM }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Patient search (debounced) ───────────────────────────────────────────
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!patientQuery.trim() || selectedPatient) {
      setPatients([]);
      setShowDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchPatients(patientQuery.trim());
        setPatients(results);
        setShowDropdown(true);
      } catch {
        setPatients([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [patientQuery, selectedPatient]);

  // ─── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectPatient(p: PatientResult) {
    setSelectedPatient(p);
    setPatientQuery(p.name);
    setShowDropdown(false);
    setPatients([]);
  }

  function clearPatient() {
    setSelectedPatient(null);
    setPatientQuery('');
  }

  // ─── Items ────────────────────────────────────────────────────────────────
  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');

      if (!selectedPatient) {
        setError('Debes seleccionar un paciente.');
        return;
      }

      const filledItems = items.filter((item) => item.name.trim());
      if (filledItems.length === 0) {
        setError('Debes agregar al menos un medicamento.');
        return;
      }

      const payload = {
        patientId: selectedPatient.patient.id,
        notes: notes.trim() || undefined,
        items: filledItems.map((item): CreatePrescriptionItemPayload => ({
          name: item.name.trim(),
          ...(item.dosage.trim() ? { dosage: item.dosage.trim() } : {}),
          ...(item.quantity && Number(item.quantity) > 0
            ? { quantity: Number(item.quantity) }
            : {}),
          ...(item.instructions.trim()
            ? { instructions: item.instructions.trim() }
            : {}),
        })),
      };

      setSubmitting(true);
      try {
        await createPrescription(payload);
        onCreated();
      } catch (err) {
        if (err instanceof AuthError) {
          window.location.replace('/auth/login');
          return;
        }
        setError((err as Error).message);
      } finally {
        setSubmitting(false);
      }
    },
    [selectedPatient, items, notes, onCreated],
  );

  // ─── Keyboard close ───────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-rx-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="create-rx-title" className="text-base font-bold text-gray-900">
            Nueva prescripción
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Error */}
          {error && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Patient search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-600">
              Paciente *
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email…"
                  value={patientQuery}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    if (selectedPatient) clearPatient();
                  }}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:opacity-50"
                />
                {selectedPatient && (
                  <button
                    type="button"
                    onClick={clearPatient}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Cambiar paciente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {searchLoading && !selectedPatient && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
                  </div>
                )}
              </div>

              {/* Selected patient badge */}
              {selectedPatient && (
                <p className="mt-1 text-xs text-gray-500">
                  Seleccionado: <span className="font-medium text-gray-700">{selectedPatient.name}</span> — {selectedPatient.email}
                </p>
              )}

              {/* Dropdown */}
              {showDropdown && patients.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => selectPatient(p)}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showDropdown && patients.length === 0 && !searchLoading && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 shadow-lg">
                  Sin resultados
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-600">
              Notas generales <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={2}
              placeholder="Ej: Paciente alérgico a penicilina"
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Medication items */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                Medicamentos *
              </label>
              <button
                type="button"
                onClick={addItem}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Agregar
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">
                      Medicamento {index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={submitting}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                        aria-label="Eliminar medicamento"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Name */}
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Nombre del medicamento *"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        required
                        disabled={submitting}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    {/* Dosage */}
                    <div>
                      <input
                        type="text"
                        placeholder="Dosis (ej: 1 cápsula c/8h)"
                        value={item.dosage}
                        onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    {/* Quantity */}
                    <div>
                      <input
                        type="number"
                        placeholder="Cantidad (ej: 21)"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    {/* Instructions */}
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Instrucciones adicionales"
                        value={item.instructions}
                        onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creando…' : 'Crear prescripción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
