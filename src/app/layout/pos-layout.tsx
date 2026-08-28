import type { ReactNode } from 'react';

interface POSLayoutProps {
  main: ReactNode;
  sidebar: ReactNode;
}

/**
 * POS-specific layout (Punto de venta / Caja / Mesas).
 * Solo contiene el contenido interno (NO trae header).
 * El header (AppHeader) lo pone el wrapper superior (TablesPage / POSPage)
 * para evitar duplicados cuando la página ya trae sidebar izq.
 */
export function POSLayout({ main, sidebar }: POSLayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden min-h-0 relative">
      {/* Product grid area */}
      <main className="flex-1 overflow-auto p-6 lg:mr-[380px] min-w-0">
        {main}
      </main>

      {/* Order ticket sidebar - fixed on desktop right side, below AppHeader (60px) */}
      <aside className="fixed bottom-0 right-0 top-[60px] hidden w-[380px] border-l bg-card lg:block z-40">
        {sidebar}
      </aside>
    </div>
  );
}
