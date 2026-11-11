import type { ApiResponse } from '@/types';

/**
 * Mensaje legible de un sobre `ApiResponse`: en un `400` el backend pone en
 * `data` el array de mensajes de validación (ver FORMS-GUIDE.md).
 */
export function apiErrorMessage(
  resp: ApiResponse<unknown>,
  fallback: string,
): string {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}
