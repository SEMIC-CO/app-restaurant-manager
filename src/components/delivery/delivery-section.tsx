import type { ReactNode } from 'react';

interface DeliverySectionProps {
  title: string;
  count: number;
  action?: ReactNode;
  children: ReactNode;
  indicatorColor?: 'primary' | 'secondary';
}

/**
 * Section wrapper for delivery order lists
 */
export function DeliverySection({ 
  title, 
  count, 
  action, 
  children,
  indicatorColor = 'primary'
}: DeliverySectionProps) {
  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${indicatorColor === 'primary' ? 'bg-primary' : 'bg-muted-foreground'}`} />
          <h2 className="font-semibold">{title}</h2>
          <span className="text-sm text-primary">{count}</span>
        </div>
        {action}
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {children}
      </div>
    </div>
  );
}
