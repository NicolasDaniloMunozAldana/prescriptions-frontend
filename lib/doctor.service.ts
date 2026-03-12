// ─── Types ───────────────────────────────────────────────────────────────────

export type PrescriptionStatus = 'pending' | 'consumed';
export type StatusFilter = 'all' | PrescriptionStatus;

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  instructions: string | null;
}

export interface DoctorPrescription {
  id: string;
  code: string;
  notes: string | null;
  status: PrescriptionStatus;
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

export interface PrescriptionMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DoctorPrescriptionsResponse {
  data: DoctorPrescription[];
  meta: PrescriptionMeta;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  doctor?: { id: string; specialty: string | null } | null;
}

export interface PatientResult {
  id: string;
  name: string;
  email: string;
  patient: { id: string; birthDate: string | null };
}

export interface CreatePrescriptionItemPayload {
  name: string;
  dosage?: string;
  quantity?: number;
  instructions?: string;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  notes?: string;
  items: CreatePrescriptionItemPayload[];
}

// ─── Error helpers ────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor() {
    super('Sesión expirada');
    this.name = 'AuthError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new AuthError();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = (data as { message?: string | string[] }).message;
    const message = Array.isArray(raw) ? raw[0] : (raw ?? 'Error inesperado');
    throw new Error(message);
  }
  return data as T;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch('/api/auth/profile');
  return handleResponse<UserProfile>(res);
}

export async function getDoctorPrescriptions(params: {
  page: number;
  status?: PrescriptionStatus;
}): Promise<DoctorPrescriptionsResponse> {
  const qs = new URLSearchParams({ page: String(params.page), limit: '10' });
  if (params.status) qs.set('status', params.status);
  const res = await fetch(`/api/doctor/prescriptions?${qs}`);
  return handleResponse<DoctorPrescriptionsResponse>(res);
}

export async function createPrescription(
  payload: CreatePrescriptionPayload,
): Promise<DoctorPrescription> {
  const res = await fetch('/api/doctor/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<DoctorPrescription>(res);
}

export async function searchPatients(query: string): Promise<PatientResult[]> {
  const qs = new URLSearchParams({ query, limit: '10' });
  const res = await fetch(`/api/doctor/patients?${qs}`);
  const data = await handleResponse<{ data: PatientResult[] }>(res);
  return data.data;
}

export async function downloadPrescriptionPDF(id: string): Promise<Blob> {
  const res = await fetch(`/api/prescriptions/${id}/pdf`);
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error('Error al descargar el PDF');
  return res.blob();
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
