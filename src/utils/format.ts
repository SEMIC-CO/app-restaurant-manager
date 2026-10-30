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
