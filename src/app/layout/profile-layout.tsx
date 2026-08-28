import type { ReactNode } from 'react';
import { AppHeader } from '@/components/common';

interface ProfileLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  main: ReactNode;
}

/**
 * Profile/Settings layout (Perfil y Configuración).
 * Patrón B: Fila → [sidebar perfil (lg+)] | [AppHeader + SubHeader seccion + main]
 */
export function ProfileLayout({ sidebar, header, main }: ProfileLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      <aside className="hidden w-[240px] flex-shrink-0 border-r lg:block h-full overflow-y-auto">
        {sidebar}
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <div className="flex h-[60px] items-center justify-between border-b bg-card px-6 flex-shrink-0">
            {header}
          </div>

          <main className="flex-1 overflow-auto p-6">
            {main}
          </main>
        </div>
      </div>
    </div>
  );
}
