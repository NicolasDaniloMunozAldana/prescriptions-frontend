import { NextRequest, NextResponse } from 'next/server';
import { setTokenCookies } from '../../../lib/server-fetch';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const body = await req.json();

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.' },
      { status: 503 },
    );
  }

  const data = await backendRes.json().catch(() => ({}));

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const { accessToken, refreshToken } = data as {
    accessToken: string;
    refreshToken: string;
  };

  const response = NextResponse.json({ ok: true });
  setTokenCookies(response, accessToken, refreshToken);
  return response;
}
