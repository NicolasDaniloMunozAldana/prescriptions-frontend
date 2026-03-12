export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

async function handleResponse(res: Response): Promise<void> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = (data as { message?: string | string[] }).message;
    const message = Array.isArray(raw) ? raw[0] : (raw ?? 'Error inesperado');
    throw new Error(message);
  }
}

/**
 * Calls the Next.js BFF route which sets httpOnly session cookies.
 * No tokens are returned to the client.
 */
export async function login(payload: LoginPayload): Promise<void> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function register(payload: RegisterPayload): Promise<void> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
