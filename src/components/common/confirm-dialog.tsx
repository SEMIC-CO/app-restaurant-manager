import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/components/ui';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Texto del mensaje; puede incluir montos o nombres resaltados. */
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` pinta el botón de confirmación en rojo. */
  variant?: 'default' | 'destructive';
  /** Se ejecuta al confirmar. El diálogo espera hasta que resuelva. */
  onConfirm: () => void | Promise<void>;
}

/**
 * Popup de confirmación (reemplaza los `window.confirm` nativos, que no se
 * pueden estilizar ni traducir). El diálogo se cierra solo si `onConfirm`
 * resuelve; si lanza, permanece abierto para que el usuario vea el error.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // El error ya lo mostró el caller (toast); el popup queda abierto.
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => void handleConfirm()}
            disabled={isConfirming}
          >
            {isConfirming ? 'Procesando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Marca visual para montos o fechas destacadas dentro del mensaje. */
export function ConfirmHighlight({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}
