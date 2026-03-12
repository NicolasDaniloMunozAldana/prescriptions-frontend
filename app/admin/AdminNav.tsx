'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

// ─── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Métricas', Icon: IconChart },
  { href: '/admin/users', label: 'Usuarios', Icon: IconUsers },
  { href: '/admin/prescriptions', label: 'Prescripciones', Icon: IconFile },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/auth/login');
  }

  // ── Mobile bottom bar variant ──────────────────────────────────────────────
  if (mobile) {
    return (
      <nav className="flex items-center justify-around px-1 py-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors ${
                active ? 'text-primary' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className={`rounded-lg p-1.5 ${
                active ? 'bg-primary/10' : ''
              }`}>
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold text-gray-400 transition-colors hover:text-gray-700"
        >
          <span className="rounded-lg p-1.5">
            <IconLogout />
          </span>
          Salir
        </button>
      </nav>
    );
  }

  // ── Desktop sidebar variant ────────────────────────────────────────────────
  return (
    <nav className="flex flex-1 flex-col p-4">
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-gray-100 pt-4">
        <button
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <IconLogout />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
