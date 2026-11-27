import type { InventoryMovementType } from '@/types';

/** Etiquetas en español de los tipos de movimiento (los valores en la BD son EN). */
export const INVENTORY_MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  INITIAL_STOCK: 'Stock inicial',
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT_IN: 'Ajuste positivo',
  ADJUSTMENT_OUT: 'Ajuste negativo',
  RETURN_EXIT: 'Devolución',
  WASTE: 'Merma',
};

/** Opciones para los selects de tipo de movimiento (orden de registro). */
export const INVENTORY_MOVEMENT_OPTIONS: {
  value: InventoryMovementType;
  label: string;
}[] = [
  { value: 'INITIAL_STOCK', label: INVENTORY_MOVEMENT_LABELS.INITIAL_STOCK },
  { value: 'ENTRY', label: INVENTORY_MOVEMENT_LABELS.ENTRY },
  { value: 'EXIT', label: INVENTORY_MOVEMENT_LABELS.EXIT },
  { value: 'ADJUSTMENT_IN', label: INVENTORY_MOVEMENT_LABELS.ADJUSTMENT_IN },
  { value: 'ADJUSTMENT_OUT', label: INVENTORY_MOVEMENT_LABELS.ADJUSTMENT_OUT },
  { value: 'RETURN_EXIT', label: INVENTORY_MOVEMENT_LABELS.RETURN_EXIT },
  { value: 'WASTE', label: INVENTORY_MOVEMENT_LABELS.WASTE },
];

/**
 * `INITIAL_STOCK`/`ENTRY`/`ADJUSTMENT_IN` suman stock; `EXIT`/`ADJUSTMENT_OUT`/
 * `RETURN_EXIT`/`WASTE` lo restan. Es el criterio con el que se calcula el
 * stock resultante de un movimiento.
 */
export function addsStock(type: InventoryMovementType): boolean {
  return (
    type === 'INITIAL_STOCK' || type === 'ENTRY' || type === 'ADJUSTMENT_IN'
  );
}

/** Clases de color del badge de tipo de movimiento. */
export const INVENTORY_MOVEMENT_BADGE_CLASS: Record<
  InventoryMovementType,
  string
> = {
  INITIAL_STOCK: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  ENTRY: 'bg-green-500/10 text-green-700 dark:text-green-400',
  EXIT: 'bg-red-500/10 text-red-700 dark:text-red-400',
  ADJUSTMENT_IN: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  ADJUSTMENT_OUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  RETURN_EXIT: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  WASTE: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
};

/** Unidades cortas de `inventory_items.unit_of_measure` (BD: varchar(20)). */
export const INVENTORY_UNITS: { value: string; label: string }[] = [
  { value: 'unit', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'l', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'm', label: 'Metro' },
  { value: 'box', label: 'Caja' },
  { value: 'pack', label: 'Paquete' },
];

/** Nombre legible de la unidad (deja el código si no está en el catálogo). */
export function inventoryUnitLabel(value: string): string {
  return INVENTORY_UNITS.find((unit) => unit.value === value)?.label ?? value;
}
