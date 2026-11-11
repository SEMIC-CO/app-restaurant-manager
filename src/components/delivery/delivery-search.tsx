import { Search } from 'lucide-react';
import { Input } from '@/components/ui';

interface DeliverySearchProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Search bar for delivery control page (por número de pedido o cliente)
 */
export function DeliverySearch({ value, onChange }: DeliverySearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por ID de pedido (#1234) o nombre del cliente..."
        className="pl-10"
      />
    </div>
  );
}
