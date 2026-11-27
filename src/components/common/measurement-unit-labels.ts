import type { MeasurementUnitType } from '@/types';

/** Etiquetas en español de `measurement_units.type` (los valores viajan EN). */
export const MEASUREMENT_UNIT_TYPE_LABELS: Record<MeasurementUnitType, string> =
  {
    QUANTITY: 'Cantidad',
    WEIGHT: 'Peso',
    VOLUME: 'Volumen',
    LENGTH: 'Longitud',
    AREA: 'Área',
    PACKAGING: 'Envase',
  };

/** Opciones para el select de tipo (mismo orden que `MeasurementUnitType`). */
export const MEASUREMENT_UNIT_TYPE_OPTIONS: {
  value: MeasurementUnitType;
  label: string;
}[] = (
  ['QUANTITY', 'WEIGHT', 'VOLUME', 'LENGTH', 'AREA', 'PACKAGING'] as const
).map((value) => ({ value, label: MEASUREMENT_UNIT_TYPE_LABELS[value] }));
