import NutrabioticsLogo from '@/app/components/auth/NutrabioticsLogo';
import AdminNav from './AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ── Sidebar ── */}
      <aside className="hidden w-60 shrink-0 flex-col bg-white shadow-sm md:flex">
        <div className="border-b border-gray-100 px-5 py-5">
          <NutrabioticsLogo />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Panel de Administración
          </p>
        </div>
        <AdminNav />
      </aside>

      {/* ── Content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <NutrabioticsLogo />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Admin</p>
        </div>

        <main className="flex-1 p-5 pb-20 md:pb-5 lg:p-8">{children}</main>
      </div>

      {/* Mobile bottom nav bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
        <AdminNav mobile />
      </div>
    </div>
  );
}
