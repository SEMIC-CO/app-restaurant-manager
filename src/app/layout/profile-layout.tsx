import type { ReactNode } from 'react';

interface ProfileLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  main: ReactNode;
}

/**
 * Profile/Settings layout with left sidebar and main content
 * Based on "Perfil y Configuración" mockup
 */
export function ProfileLayout({ sidebar, header, main }: ProfileLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Left sidebar */}
      <aside className="hidden w-[240px] flex-shrink-0 border-r lg:block">
        {sidebar}
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-[60px] items-center justify-between border-b bg-card px-6">
          {header}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {main}
        </main>
      </div>
    </div>
  );
}
