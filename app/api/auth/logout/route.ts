import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch, clearTokenCookies } from '../../../lib/server-fetch';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;

  // Best-effort revocation — cookies are cleared regardless of backend response
  await authenticatedFetch(req, '/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(refreshToken ? { body: JSON.stringify({ refreshToken }) } : {}),
  }).catch(() => null);

  const response = NextResponse.json({ ok: true });
  clearTokenCookies(response);
  return response;
}
