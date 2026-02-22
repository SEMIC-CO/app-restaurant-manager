import { Search, SlidersHorizontal } from 'lucide-react';
import { Input, Button } from '@/components/ui';

interface DeliverySearchProps {
  value: string;
  onChange: (value: string) => void;
  onFilter?: () => void;
}

/**
 * Search bar for delivery control page
 */
export function DeliverySearch({ value, onChange, onFilter }: DeliverySearchProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por ID de pedido (#1234) o nombre del cliente..."
          className="pl-10"
        />
      </div>
      <Button variant="outline" size="icon" onClick={onFilter}>
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
