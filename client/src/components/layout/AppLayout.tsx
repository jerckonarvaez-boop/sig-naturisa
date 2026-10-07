import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col print:block print:h-auto">
      {/* Al imprimir se ocultan el encabezado y el menú, y el contenido se muestra completo */}
      <div className="contents print:hidden">
        <Header onToggleMenu={() => setMobileMenuOpen((open) => !open)} />
      </div>
      <div className="relative flex min-h-0 flex-1 print:block">
        <div className="contents print:hidden">
          <Sidebar open={mobileMenuOpen} onNavigate={() => setMobileMenuOpen(false)} />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
