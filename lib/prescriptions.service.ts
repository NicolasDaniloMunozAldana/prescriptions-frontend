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

export interface Prescription {
  id: string;
  code: string;
  notes: string | null;
  status: PrescriptionStatus;
  createdAt: string;
  consumedAt: string | null;
  items: PrescriptionItem[];
  author: {
    specialty: string | null;
    user: { name: string };
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface PrescriptionMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PrescriptionsResponse {
  data: Prescription[];
  meta: PrescriptionMeta;
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

export async function getPrescriptions(params: {
  page: number;
  status?: PrescriptionStatus;
}): Promise<PrescriptionsResponse> {
  const qs = new URLSearchParams({ page: String(params.page), limit: '10' });
  if (params.status) qs.set('status', params.status);
  const res = await fetch(`/api/prescriptions?${qs}`);
  return handleResponse<PrescriptionsResponse>(res);
}

export async function consumePrescription(id: string): Promise<Prescription> {
  const res = await fetch(`/api/prescriptions/${id}/consume`, { method: 'PUT' });
  return handleResponse<Prescription>(res);
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
