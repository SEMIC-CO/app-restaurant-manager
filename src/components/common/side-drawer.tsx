import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SideDrawerProps {
  /** Estado controlado del drawer (abierto / cerrado). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título accesible del panel (`aria-label`). */
  title: string;
  /** Muestra el título en la cabecera (por defecto sí). */
  showTitle?: boolean;
  /** Ícono junto al título (por defecto, el carrito). */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Drawer lateral DERECHO (patrón de `MobileSidebarDrawer`, sin dependencias):
 * backdrop + panel que se desliza con `transition-transform`.
 *
 * Cierra con el botón ✕, con clic en el backdrop o con la tecla ESC, y
 * bloquea el scroll del `body` mientras está abierto.
 *
 * Detalle de z-index: el drawer usa `z-[45]` para quedar sobre el FAB del
 * carrito (`z-40`) pero DEBAJO de los dialogs Radix (`z-50`), de modo que
 * el popup de mesas y el diálogo de cobro abiertos desde dentro del
 * contenido se muestren encima.
 */
export function SideDrawer({
  open,
  onOpenChange,
  title,
  showTitle = true,
  icon,
  children,
  className,
}: SideDrawerProps) {
  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Bloquear el scroll del body mientras está abierto
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[45] lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Panel lateral derecho */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // El contenido oculto no debe recibir foco con el tabulador
        inert={!open}
        className={cn(
          'absolute right-0 top-0 flex h-full w-[92%] max-w-[440px] flex-col border-l bg-card shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
      >
        {/* Cabecera del drawer: título + botón cerrar. `showTitle=false`
            deja solo el ícono y la ✕ (para paneles que ya traen su
            propio título en la primera fila). */}
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
          {icon}
          {showTitle ? (
            <h2 className="min-w-0 flex-1 truncate text-base font-bold">
              {title}
            </h2>
          ) : (
            <span className="flex-1" />
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar panel"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido (h-full para que sus paneles internos manejen su scroll) */}
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </aside>
    </div>
  );
}
