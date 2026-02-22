import type { ReactNode } from 'react';
import { GlobalHeader } from '@/components/common';

interface POSLayoutProps {
  main: ReactNode;
  sidebar: ReactNode;
}

/**
 * POS-specific layout with header, main content area, and fixed sidebar
 * Responsive: sidebar collapses on smaller screens
 */
export function POSLayout({ main, sidebar }: POSLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <GlobalHeader />
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Product grid area */}
        <main className="flex-1 overflow-auto p-6 lg:mr-[380px]">
          {main}
        </main>

        {/* Order ticket sidebar - fixed on desktop, hidden on mobile */}
        <aside className="fixed bottom-0 right-0 top-[73px] hidden w-[380px] border-l bg-card lg:block">
          {sidebar}
        </aside>
      </div>
    </div>
  );
}
