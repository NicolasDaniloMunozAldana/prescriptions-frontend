'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '../auth.api';
import PasswordInput from '../../components/auth/PasswordInput';


interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleStep1(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    setStep(2);
  }

  async function handleStep2(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const tokens = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // Store tokens — move to httpOnly cookies via an API route for production
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* ── Left branding panel ── */}
        <div className="flex w-2/5 flex-col justify-center px-10 py-12">
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900">
            Accede al universo Nutrabiotics
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Bienvenido al ecosistema NUTRABIOTICS. Un universo diseñado para ti.
          </p>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex w-3/5 flex-col justify-center px-12 py-12">
          {step === 1 ? (
            <form onSubmit={handleStep1} className="flex flex-col gap-5">
              {/* Full name */}
              <div className="flex flex-col gap-1.5">
                <input
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Nombre completo*"
                  value={form.name}
                  onChange={update('name')}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Correo electrónico*"
                  value={form.email}
                  onChange={update('email')}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* Error */}
              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Buttons */}
              <div className="mt-1 flex gap-3">
                <Link
                  href="/auth/login"
                  className="flex flex-1 items-center justify-center rounded-full border border-primary py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 cursor-pointer"
                >
                  Volver
                </Link>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="flex flex-col gap-5">
              {/* Email (pre-filled from step 1) */}
              <div className="flex flex-col gap-1.5">
                <input
                  id="email2"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Correo electrónico*"
                  value={form.email}
                  onChange={update('email')}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* Password security hint */}
              <div className="rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold text-gray-700">
                  Seguridad de la contraseña:
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  Utiliza como mínimo 8 caracteres, incluir una mayúscula, un número y un
                  símbolo. No utilices una contraseña de otro sitio ni un término que sea
                  demasiado obvio, como el nombre de tu mascota.
                </p>
              </div>

              {/* New password */}
              <PasswordInput
                id="password"
                name="password"
                placeholder="Nueva contraseña*"
                value={form.password}
                onChange={update('password')}
                disabled={loading}
                required
              />

              {/* Confirm password */}
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirmar nueva contraseña*"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                disabled={loading}
                required
              />

              {/* Error */}
              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Buttons */}
              <div className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(1); }}
                  disabled={loading}
                  className="flex-1 rounded-full border border-[#8B2615] py-3 text-sm font-semibold text-[#8B2615] transition hover:bg-red-50 disabled:opacity-50"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full bg-[#8B2615] py-3 text-sm font-semibold text-white transition hover:bg-[#7a2012] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Registrando…' : 'Continuar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
