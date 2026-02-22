import { Shield, CreditCard, Bell } from 'lucide-react';
import { Card } from '@/components/ui';

interface ConfigOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

const configOptions: ConfigOption[] = [
  {
    id: 'security',
    title: 'Seguridad',
    description: 'Contraseña y 2FA',
    icon: <Shield className="h-5 w-5 text-blue-600" />,
    iconBg: 'bg-blue-100',
  },
  {
    id: 'payments',
    title: 'Pagos',
    description: 'Pasarelas y comisiones',
    icon: <CreditCard className="h-5 w-5 text-green-600" />,
    iconBg: 'bg-green-100',
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Alertas de stock y pedidos',
    icon: <Bell className="h-5 w-5 text-yellow-600" />,
    iconBg: 'bg-yellow-100',
  },
];

interface AdditionalConfigCardProps {
  onConfigClick?: (configId: string) => void;
}

/**
 * Additional configuration options card
 */
export function AdditionalConfigCard({ onConfigClick }: AdditionalConfigCardProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Configuraciones Adicionales</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {configOptions.map((option) => (
          <Card 
            key={option.id}
            className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onConfigClick?.(option.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${option.iconBg}`}>
                {option.icon}
              </div>
              <div>
                <p className="font-medium">{option.title}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
