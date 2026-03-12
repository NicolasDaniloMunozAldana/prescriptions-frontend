import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch, setTokenCookies } from '../../../../lib/server-fetch';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { backendRes, newTokens } = await authenticatedFetch(
    req,
    `/prescriptions/${id}/pdf`,
  );

  if (!backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  }

  const buffer = await backendRes.arrayBuffer();
  const contentDisposition =
    backendRes.headers.get('Content-Disposition') ??
    `attachment; filename="prescripcion-${id}.pdf"`;

  const response = new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
    },
  });

  if (newTokens) {
    setTokenCookies(response, newTokens.accessToken, newTokens.refreshToken);
  }

  return response;
}
