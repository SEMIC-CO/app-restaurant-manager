import { Package, CheckCircle, Receipt } from 'lucide-react';
import { Card } from '@/components/ui';

interface DeliveryStatsProps {
  /** Pedidos que la cocina dejó listos (`ready`). */
  readyCount: number;
  /** Pedidos entregados hoy (`delivered`). */
  deliveredToday: number;
  /** Todos los pedidos del día (cualquier estado). */
  totalToday: number;
}

/**
 * Stats cards for delivery control page
 */
export function DeliveryStats({ readyCount, deliveredToday, totalToday }: DeliveryStatsProps) {
  const stats = [
    {
      label: 'Listos para Entrega',
      value: readyCount,
      icon: <Package className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Entregados Hoy',
      value: deliveredToday,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Pedidos Hoy',
      value: totalToday,
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
