import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  /** Día que representa el reporte (`DashboardReport.date`, `AAAA-MM-DD`). */
  date: string;
  /** `true` mientras corre un refresco con datos ya en pantalla. */
  refreshing: boolean;
  onRefresh: () => void;
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-VE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function greetingFor(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Encabezado del dashboard: saludo con el nombre de la persona, el día que
 * se está pintando, el indicador de actualización en vivo y el botón para
 * recargar a mano.
 */
export function DashboardHeader({ date, refreshing, onRefresh }: DashboardHeaderProps) {
  const name = useAuthStore((state) => state.user?.name);
  const label = `${greetingFor(new Date().getHours())}${name ? `, ${name}` : ''}`;
  // `date` llega como fecha pura: se convierte a medianoche LOCAL para que
  // el calendario no corra un día por la zona horaria.
  const dateLabel = DATE_FORMAT.format(new Date(`${date}T00:00:00`));

  return (
    <div className="rounded-lg border-b bg-background px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{label}</h1>
          <p className="text-muted-foreground">
            Así va tu restaurante hoy · {dateLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Actualización en vivo
          </span>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
