'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '../auth.api';
import PasswordInput from '../../components/auth/PasswordInput';
import NutrabioticsLogo from '../../components/auth/NutrabioticsLogo';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      router.push('/patient');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl shadow-xl">
        {/* ── Left branding panel ── */}
        <div className="flex w-2/5 flex-col justify-between bg-gray-50 p-10">
          <NutrabioticsLogo />
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900">
              Accede al universo Nutrabiotics
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Tu portal personalizado para gestionar tu salud y bienestar con
              soluciones avanzadas de nutrición.
            </p>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex w-3/5 flex-col justify-center bg-white px-12 py-10">
          <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-gray-500">
            Bienvenido de nuevo a tu portal de salud.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="ejemplo@nutrabiotics.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                  Contraseña
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-primary hover:primary/90"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                placeholder="········"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Aún no tienes cuenta?{' '}
            <Link
              href="/auth/register"
              className="font-semibold text-primary hover:text-primary/90"
            >
              Crea tu cuenta ahora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
