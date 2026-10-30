import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface POSLayoutProps {
  main: ReactNode;
  sidebar: ReactNode;
  /**
   * Banner derecho un poco más ancho (Pedidos: listado y creación).
   * La Caja mantiene el ancho estándar de 380px.
   */
  wide?: boolean;
}

/**
 * POS-specific layout (Punto de venta / Caja / Mesas).
 * Solo contiene el contenido interno (NO trae header).
 * El header (AppHeader) lo pone el wrapper superior (TablesPage / POSPage)
 * para evitar duplicados cuando la página ya trae sidebar izq.
 */
export function POSLayout({ main, sidebar, wide = false }: POSLayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden min-h-0 relative">
      {/* Product grid area */}
      <main
        className={cn(
          'flex-1 overflow-auto p-6 min-w-0',
          wide ? 'lg:mr-[420px]' : 'lg:mr-[380px]',
        )}
      >
        {main}
      </main>

      {/* Order ticket sidebar - fixed on desktop right side, below AppHeader (60px) */}
      <aside
        className={cn(
          'fixed bottom-0 right-0 top-[60px] hidden border-l bg-card lg:block z-40',
          wide ? 'w-[420px]' : 'w-[380px]',
        )}
      >
        {sidebar}
      </aside>
    </div>
  );
}
