import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch, setTokenCookies } from '../../../lib/server-fetch';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();

  const query = searchParams.get('query');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  if (query) qs.set('query', query);
  if (page) qs.set('page', page);
  if (limit) qs.set('limit', limit);

  const { backendRes, newTokens } = await authenticatedFetch(
    req,
    `/api/patients?${qs}`,
  );

  const data = await backendRes.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: backendRes.status });

  if (newTokens) {
    setTokenCookies(response, newTokens.accessToken, newTokens.refreshToken);
  }

  return response;
}
