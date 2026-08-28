import type { ReactNode } from 'react';
import { AppHeader } from '@/components/common';

interface KitchenLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

/**
 * Kitchen layout (Panel de Pedidos / Cocina).
 * Patrón B: Fila → [sidebar contador de pendientes (lg+)] | [AppHeader + main tickets]
 */
export function KitchenLayout({ sidebar, main }: KitchenLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      <aside className="hidden w-[200px] flex-shrink-0 bg-primary text-primary-foreground lg:block h-full overflow-y-auto">
        {sidebar}
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>
        <main className="flex-1 overflow-auto p-6 min-w-0">
          {main}
        </main>
      </div>
    </div>
  );
}
