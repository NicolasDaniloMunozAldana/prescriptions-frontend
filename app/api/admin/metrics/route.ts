import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch, setTokenCookies } from '../../../lib/server-fetch';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);

  const path = `/api/admin/metrics${qs.toString() ? `?${qs}` : ''}`;
  const { backendRes, newTokens } = await authenticatedFetch(req, path);

  const data = await backendRes.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: backendRes.status });
  if (newTokens) setTokenCookies(response, newTokens.accessToken, newTokens.refreshToken);
  return response;
}
