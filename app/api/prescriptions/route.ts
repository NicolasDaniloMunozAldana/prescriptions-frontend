import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch, setTokenCookies } from '../../lib/server-fetch';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();

  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  const status = searchParams.get('status');

  if (page) qs.set('page', page);
  if (limit) qs.set('limit', limit);
  if (status) qs.set('status', status);

  const { backendRes, newTokens } = await authenticatedFetch(
    req,
    `/api/prescriptions/mine?${qs}`,
  );

  const data = await backendRes.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: backendRes.status });

  if (newTokens) {
    setTokenCookies(response, newTokens.accessToken, newTokens.refreshToken);
  }

  return response;
}
