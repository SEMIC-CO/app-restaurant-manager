import type { ReactNode } from 'react';
import { GlobalHeader } from '@/components/common';

interface DashboardLayoutProps {
  main: ReactNode;
}

/**
 * Dashboard layout for pages like Entregas and Análisis
 * Full-width content area with top header
 */
export function DashboardLayout({ main }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Header with navigation */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <GlobalHeader />
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        {main}
      </main>
    </div>
  );
}
