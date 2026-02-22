import { Package, FileText, Receipt } from 'lucide-react';
import { Card } from '@/components/ui';

interface DeliveryStatsProps {
  readyCount: number;
  pendingInvoice: number;
  invoicedToday: number;
}

/**
 * Stats cards for delivery control page
 */
export function DeliveryStats({ readyCount, pendingInvoice, invoicedToday }: DeliveryStatsProps) {
  const stats = [
    {
      label: 'Listos para Entrega',
      value: readyCount,
      icon: <Package className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Por Facturar',
      value: pendingInvoice,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Facturados Hoy',
      value: invoicedToday,
      icon: <Receipt className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex items-center gap-4 p-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor} ${stat.color}`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
