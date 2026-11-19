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
      {/* Section header. En móvil (< sm) se apila: primero el título y
          después los filtros; desde sm vuelven a ir en la misma fila. */}
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${indicatorColor === 'primary' ? 'bg-primary' : 'bg-muted-foreground'}`} />
          <h2 className="font-semibold">{title}</h2>
          <span className="text-sm text-primary">{count}</span>
        </div>
        {action}
      </div>

      {/* Cards grid: 2 columnas desde md (antes lg dejaba una sola y las
          tarjetas salían gigantes) y gaps más apretados. */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}
