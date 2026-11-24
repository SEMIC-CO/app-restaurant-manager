/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Fecha local en formato AAAA-MM-DD (para filtros `dateFrom`/`dateTo` de la API).
 */
export function toISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Límites UTC del día LOCAL para filtros contra columnas `timestamp` de la API.
 *
 * El backend guarda `order_datetime` en UTC, así que enviar solo `AAAA-MM-DD`
 * local deja fuera los pedidos creados de noche en zonas con offset negativo
 * (Colombia UTC-5: las 20:00 local ya son las 01:00 UTC del día siguiente).
 * Aquí se convierten las medianoches locales a sus equivalentes UTC.
 */
export function localDayUtcRange(
  date: Date = new Date(),
): { dateFrom: string; dateTo: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

/**
 * Rango del MES EN CURSO (día 1 → último día) en `YYYY-MM-DD` local.
 * Período por defecto para "todos los pagos del mes" (nómina, historial).
 * Se recalcula en cada llamada por si la pestaña queda abierta al cambiar de mes.
 */
export function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

/**
 * Format a date to relative time (e.g., "5 min")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  return `${Math.floor(diffHours / 24)}d`;
}

/**
 * Format time range (e.g., "08:00 - 16:00")
 */
export function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

/**
 * Etiqueta visible de un número de pedido: numeral + código limpio.
 *
 * - Nuevo: `20261025-0007` → `#20261025-0007`
 * - Legado: `ORD-001` / `PED-20261025-0011` → sin el prefijo (`#001`, `#20261025-0011`)
 */
export function formatOrderNumber(orderNumber: string): string {
  return `#${orderNumber.replace(/^(ORD|PED)-/, '')}`;
}

/**
 * Formatea un tamaño en bytes a una unidad legible (ej. "843 KB", "1.4 MB").
 * Útil para mostrar el ahorro de la pre-compresión antes de subir.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Construye la URL pública de una imagen guardada en el servidor.
 *
 * La BD guarda solo la ruta relativa (`productos/prod-<uuid>.webp`); el
 * dominio vive en `VITE_STORAGE_URL` (p.ej. `http://localhost:3000/files`).
 * Las URLs absolutas (http/https) se devuelven tal cual.
 */
export function resolveStorageUrl(
  relativePath?: string | null,
): string | null {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;

  const base = (import.meta.env.VITE_STORAGE_URL as string | undefined) ?? '';
  if (!base) return null;

  return `${base.replace(/\/+$/, '')}/${relativePath.replace(/^\/+/, '')}`;
}
