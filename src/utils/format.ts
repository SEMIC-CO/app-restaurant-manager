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
 * Generate a short order ID for display
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.replace('ORD-', '#');
}
