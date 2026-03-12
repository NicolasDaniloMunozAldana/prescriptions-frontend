// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'doctor' | 'patient';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  doctor: { id: string; specialty: string | null } | null;
  patient: { id: string; birthDate: string | null } | null;
}

export interface UsersResponse {
  data: UserRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  specialty?: string;
  birthDate?: string;
}

export interface UpdateUserPayload {
  name?: string;
  specialty?: string;
  birthDate?: string;
}

export interface MetricsByDay {
  date: string;
  count: number;
}

export interface TopDoctor {
  doctorId: string;
  name: string;
  count: number;
}

export interface Metrics {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
  byStatus: { pending?: number; consumed?: number };
  byDay: MetricsByDay[];
  topDoctors: TopDoctor[];
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

export async function getMetrics(params?: {
  from?: string;
  to?: string;
}): Promise<Metrics> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const res = await fetch(`/api/admin/metrics${qs.toString() ? `?${qs}` : ''}`);
  return handleResponse<Metrics>(res);
}

export async function getUsers(params?: {
  role?: UserRole;
  query?: string;
  page?: number;
  limit?: number;
}): Promise<UsersResponse> {
  const qs = new URLSearchParams();
  if (params?.role) qs.set('role', params.role);
  if (params?.query) qs.set('query', params.query);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const res = await fetch(`/api/admin/users${qs.toString() ? `?${qs}` : ''}`);
  return handleResponse<UsersResponse>(res);
}

export async function createUser(payload: CreateUserPayload): Promise<UserRecord> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<UserRecord>(res);
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserRecord> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<UserRecord>(res);
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  return handleResponse<{ message: string }>(res);
}
