import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch, setTokenCookies } from '../../../lib/server-fetch';

export async function GET(req: NextRequest) {
  const { backendRes, newTokens } = await authenticatedFetch(req, '/api/auth/profile');

  const data = await backendRes.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: backendRes.status });

  if (newTokens) {
    setTokenCookies(response, newTokens.accessToken, newTokens.refreshToken);
  }

  return response;
}
