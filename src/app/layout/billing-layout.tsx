import type { ReactNode } from 'react';
import { AppHeader } from '@/components/common';

interface BillingLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  footer: ReactNode;
}

/**
 * Billing layout (Facturación).
 * Patrón B: Fila → [sidebar métodos pago (lg+)] | [AppHeader + main + footer]
 */
export function BillingLayout({ sidebar, main, footer }: BillingLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      <aside className="hidden w-[240px] flex-shrink-0 lg:block h-full overflow-y-auto">
        {sidebar}
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <main className="flex-1 overflow-auto p-6">
            {main}
          </main>

          <footer className="flex-shrink-0">
            {footer}
          </footer>
        </div>
      </div>
    </div>
  );
}
