import type { ReactNode } from 'react';
import { GlobalHeader } from '@/components/common';

interface KitchenLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

/**
 * Kitchen layout with left sidebar for pending counts and main area for ticket queue
 * Based on "Panel de Pedidos" mockup
 */
export function KitchenLayout({ sidebar, main }: KitchenLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <GlobalHeader />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Pending counts */}
        <aside className="hidden w-[200px] flex-shrink-0 bg-primary text-primary-foreground lg:block">
          {sidebar}
        </aside>

        {/* Ticket queue */}
        <main className="flex-1 overflow-auto p-6">
          {main}
        </main>
      </div>
    </div>
  );
}
