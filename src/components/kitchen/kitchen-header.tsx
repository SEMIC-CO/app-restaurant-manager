import { Clock } from 'lucide-react';
import { Button } from '@/components/ui';

interface KitchenHeaderProps {
  currentTime: string;
  isBusy?: boolean;
  onToggleBusy?: () => void;
}

/**
 * Kitchen header with clock and busy mode toggle
 */
export function KitchenHeader({ 
  currentTime, 
  isBusy = false, 
  onToggleBusy 
}: KitchenHeaderProps) {
  return (
    <div className="flex h-[60px] items-center justify-between px-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-lg">
          📋
        </div>
        <h1 className="text-xl font-bold">Panel de Pedidos</h1>
      </div>

      {/* Right side: Clock + Busy mode */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{currentTime}</span>
        </div>

        {/* Busy mode toggle */}
        <Button
          variant={isBusy ? 'default' : 'outline'}
          onClick={onToggleBusy}
          className={isBusy ? 'bg-primary' : ''}
        >
          {isBusy ? 'Modo Ocupado' : 'Modo Normal'}
        </Button>
      </div>
    </div>
  );
}
