import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default async function Home() {
  const store = await cookies();
  const accessToken = store.get('access_token')?.value;
  const refreshToken = store.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    redirect('/auth/login');
  }

  try {
    if (accessToken) {
      const res = await fetch(`${BACKEND}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const profile = await res.json();
        redirect(profile?.role === 'doctor' ? '/doctor' : '/dashboard');
      }
    }
  } catch {
    // fall through to default redirect
  }

  redirect('/dashboard');
}
