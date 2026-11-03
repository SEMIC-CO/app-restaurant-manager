import { useEffect, useState } from 'react';
import { headquarterService } from '@/services';
import { useAuthStore } from '@/store';
import type { Headquarters } from '@/types';

/**
 * Caché en módulo: la sede del usuario no cambia durante la sesión, así el
 * header no vuelve a pedirla al montar/desmontar cada página. Se invalida sola
 * si cambia el `headquarterId` (otra sesión = otra clave).
 */
const headquarterCache = new Map<number, Headquarters>();

/** Peticiones en vuelo, para no repetir la llamada al montar varios componentes. */
const inflight = new Map<number, Promise<Headquarters | null>>();

function loadHeadquarter(id: number): Promise<Headquarters | null> {
  const cached = headquarterCache.get(id);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(id);
  if (pending) return pending;

  const request = headquarterService
    .getById(id)
    .then((resp) => {
      if (resp.code === 200 && resp.data) {
        headquarterCache.set(id, resp.data);
        return resp.data;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(id);
    });

  inflight.set(id, request);
  return request;
}

/**
 * Sede del usuario autenticado (`user.headquarterId` de la sesión).
 * Devuelve `null` mientras carga, si el usuario no tiene sede asignada o si
 * el backend no responde (la app sigue funcionando sin el nombre).
 */
export function useCurrentHeadquarter(): Headquarters | null {
  const headquarterId = useAuthStore(
    (state) => state.user?.headquarterId ?? null,
  );
  const [result, setResult] = useState<{ id: number; headquarter: Headquarters } | null>(() => {
    if (!headquarterId) return null;
    const cached = headquarterCache.get(headquarterId);
    return cached ? { id: headquarterId, headquarter: cached } : null;
  });

  useEffect(() => {
    if (!headquarterId) return;

    let active = true;
    void loadHeadquarter(headquarterId).then((headquarter) => {
      if (active && headquarter) setResult({ id: headquarterId, headquarter });
    });

    return () => {
      active = false;
    };
  }, [headquarterId]);

  // Si cambia la sede (otra sesión), el resultado anterior ya no aplica.
  return result && result.id === headquarterId ? result.headquarter : null;
}
