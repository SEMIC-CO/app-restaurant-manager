import type { ReactNode } from 'react';
import { AppHeader } from '@/components/common';

interface ConfigLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

/**
 * Patrón B — Layout para módulos de Configuración / Ajustes.
 * Estructura en FILA (no columna):
 *   [Aside 220px (solo lg+)] | [ AppHeader (arriba) + Main (abajo) ]
 * Así el AppHeader (logo + search + user) queda AL LADO del sidebar,
 * no duplicado por encima como un header transversal.
 */
export function ConfigLayout({ sidebar, main }: ConfigLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      {/* Left sidebar - Navigation (desktop only) */}
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        {sidebar}
      </aside>

      {/* Right content column */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* App header (al lado del sidebar, no encima) */}
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto min-w-0">
          {main}
        </main>
      </div>

      {/* Mobile drawer es global en App.tsx (MobileSidebarDrawer) */}
    </div>
  );
}
