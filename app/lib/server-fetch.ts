import type { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const IS_PROD = process.env.NODE_ENV === 'production';

export function setTokenCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearTokenCookies(res: NextResponse): void {
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
}

interface AuthFetchResult {
  backendRes: Response;
  newTokens?: { accessToken: string; refreshToken: string };
}

/**
 * Authenticated fetch towards the NestJS backend.
 * On HTTP 401 it attempts a single token refresh (rotation), retries the
 * original request and returns the new token pair so the caller can update
 * the response cookies.
 */
export async function authenticatedFetch(
  req: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<AuthFetchResult> {
  const existingHeaders = (init.headers as Record<string, string>) ?? {};

  const doRequest = (token: string) =>
    fetch(`${BACKEND}${path}`, {
      ...init,
      headers: { ...existingHeaders, Authorization: `Bearer ${token}` },
    });

  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    const res = await doRequest(accessToken);
    if (res.status !== 401) return { backendRes: res };
  }

  // ─── Attempt refresh ─────────────────────────────────────────────────────
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return {
      backendRes: new Response(
        JSON.stringify({ message: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }

  const refreshRes = await fetch(`${BACKEND}/api/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  if (!refreshRes.ok) {
    return {
      backendRes: new Response(
        JSON.stringify({ message: 'Sesión expirada. Inicia sesión nuevamente.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }

  const newTokens = (await refreshRes.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const retryRes = await doRequest(newTokens.accessToken);
  return { backendRes: retryRes, newTokens };
}
