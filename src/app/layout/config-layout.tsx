import type { ReactNode } from 'react';
import { GlobalHeader } from '@/components/common';

interface ConfigLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

/**
 * Configuration layout with left sidebar for navigation and main area for content
 */
export function ConfigLayout({ sidebar, main }: ConfigLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <GlobalHeader />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Navigation */}
        <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block">
          {sidebar}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {main}
        </main>
      </div>
    </div>
  );
}
