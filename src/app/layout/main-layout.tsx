import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

/**
 * Main layout with optional right sidebar
 * Used for POS view with product grid + order ticket
 */
export function MainLayout({ children, sidebar }: MainLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {children}
      {sidebar && (
        <aside className="fixed right-0 top-0 hidden h-screen w-[380px] border-l bg-card lg:block">
          {sidebar}
        </aside>
      )}
    </div>
  );
}
