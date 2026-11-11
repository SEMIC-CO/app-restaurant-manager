import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Textarea,
} from '@/components/ui';
import { INVENTORY_MOVEMENT_LABELS } from './inventory-labels';
import type { ApiInventoryMovement } from '@/types';

const voidReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Explica el motivo: mínimo 3 caracteres')
    .max(255, 'El motivo no puede superar los 255 caracteres'),
});

type VoidReasonFormData = z.infer<typeof voidReasonSchema>;

interface InventoryMovementVoidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Movimiento a anular (se muestra en solo lectura). */
  movement: ApiInventoryMovement | null;
  /** Anula en el backend. Si lanza, el diálogo permanece abierto. */
  onConfirm: (reason: string) => Promise<void>;
}

/**
 * Anulación de un movimiento mal digitado (equivalente a una nota crédito):
 * el kardex **no se edita ni se borra**, el movimiento queda marcado con el
 * motivo y el usuario, y desde ese momento no cuenta ni para el stock ni para
 * el costo vigente.
 */
export function InventoryMovementVoidDialog({
  open,
  onOpenChange,
  movement,
  onConfirm,
}: InventoryMovementVoidDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VoidReasonFormData>({
    resolver: zodResolver(voidReasonSchema),
    defaultValues: { reason: '' },
  });

  React.useEffect(() => {
    if (open) reset({ reason: '' });
  }, [open, reset]);

  const handleFormSubmit = async (data: VoidReasonFormData) => {
    try {
      await onConfirm(data.reason.trim());
      onOpenChange(false);
    } catch (error) {
      console.error('Error anulando movimiento:', error);
    }
  };

  if (!movement) return null;

  const isEntry = movement.movementType === 'ENTRY';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Anular movimiento #{movement.id}</DialogTitle>
          <DialogDescription>
            No se borra ni se edita: queda en el historial como anulado y deja de
            contar para el stock y para el costo vigente.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Artículo</span>
            <span className="text-right font-medium">
              {movement.itemName || `#${movement.inventoryItemId}`}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Tipo</span>
            <span className="text-right font-medium">
              {INVENTORY_MOVEMENT_LABELS[movement.movementType]}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cantidad</span>
            <span className="text-right font-medium tabular-nums">
              {movement.movementType === 'ENTRY' ||
              movement.movementType === 'ADJUSTMENT_IN'
                ? '+'
                : '−'}
              {movement.quantity}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Registrado</span>
            <span className="text-right font-medium">
              {movement.createdByName || '—'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="void-reason">Motivo de la anulación *</Label>
            <Textarea
              id="void-reason"
              placeholder="Error de digitación: eran 10, no 100..."
              rows={2}
              {...register('reason')}
            />
            <p className="text-xs text-muted-foreground">
              {isEntry
                ? 'Al anular una entrada, el costo vigente del artículo se recalcula al instante con sus entradas restantes.'
                : 'El stock de la sede se recalcula al instante con el resto de los movimientos.'}
            </p>
            {errors.reason && (
              <p className="text-xs text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Anulando...' : 'Anular movimiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
