import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch, setTokenCookies } from '../../../lib/server-fetch';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    qs.set(key, value);
  }

  const path = `/api/admin/prescriptions${qs.toString() ? `?${qs}` : ''}`;
  const { backendRes, newTokens } = await authenticatedFetch(req, path);

  const data = await backendRes.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: backendRes.status });
  if (newTokens) setTokenCookies(response, newTokens.accessToken, newTokens.refreshToken);
  return response;
}
