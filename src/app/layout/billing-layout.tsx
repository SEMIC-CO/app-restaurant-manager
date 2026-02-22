import type { ReactNode } from 'react';
import { GlobalHeader } from '@/components/common';

interface BillingLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  footer: ReactNode;
}

/**
 * Billing layout with left sidebar, main content area, and footer
 * Based on "Facturación" mockup
 */
export function BillingLayout({ sidebar, main, footer }: BillingLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <GlobalHeader />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="hidden w-[240px] flex-shrink-0 lg:block">
          {sidebar}
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-auto p-6">
            {main}
          </main>

          {/* Footer */}
          <footer className="flex-shrink-0">
            {footer}
          </footer>
        </div>
      </div>
    </div>
  );
}
