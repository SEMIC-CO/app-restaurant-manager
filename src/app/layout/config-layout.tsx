import type { ReactNode } from 'react';
import { AppHeader } from '@/components/common';

interface ConfigLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export function ConfigLayout({ sidebar, main }: ConfigLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        {sidebar}
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        <main className="flex-1 overflow-auto min-w-0">
          {main}
        </main>
      </div>
    </div>
  );
}
