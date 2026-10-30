import { useState, useEffect } from 'react';
import { categoryService, productService } from '@/services';
import { resolveStorageUrl } from '@/utils';
import type { ApiProduct, Category, Product } from '@/types';

/** Adapta un producto del API al modelo de las vistas de Caja/Pedidos. */
function toProduct(api: ApiProduct): Product {
  return {
    id: String(api.id),
    name: api.name,
    description: api.description ?? '',
    price: Number(api.price),
    image: resolveStorageUrl(api.imageUrl) ?? undefined,
    categoryId: String(api.categoryId),
    isAvailable: api.available ?? true,
  };
}

/**
 * Productos **disponibles** de la sede (API real, sin mock).
 * `categoryId` = `'all'` (o el id de la categoría activa en los filtros).
 *
 * `loading` se deriva de los datos (`result.key !== categoryId`), así no hace
 * falta un `setState` síncrono al inicio del efecto.
 */
export function useProducts(categoryId: string = 'all') {
  const [result, setResult] = useState<{
    key: string;
    products: Product[];
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    productService
      .listAllAvailable(categoryId === 'all' ? undefined : Number(categoryId))
      .then((items) => {
        if (active) {
          setError(null);
          setResult({ key: categoryId, products: items.map(toProduct) });
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setResult({ key: categoryId, products: [] });
          setError(
            err instanceof Error
              ? err
              : new Error('No se pudieron cargar los productos'),
          );
        }
      });

    return () => {
      active = false;
    };
  }, [categoryId]);

  const loading = result?.key !== categoryId;
  const products = result?.key === categoryId ? result.products : [];

  return { products, loading, error };
}

/**
 * Categorías del menú para los filtros: pestaña "Todas" + las categorías
 * **activas reales** de la sede (`categories` del backend).
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', name: 'Todas', order: -1 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const resp = await categoryService.list({ limit: 100, active: true });
        if (!active) return;
        if (resp.code === 200) {
          setCategories([
            { id: 'all', name: 'Todas', order: -1 },
            ...resp.data.items
              .filter((category) => category.active)
              .map((category, index) => ({
                id: String(category.id),
                name: category.name,
                order: index,
              })),
          ]);
        }
      } catch {
        // Sin conexión se queda solo con la pestaña "Todas"
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}

/**
 * Búsqueda de productos en el catálogo (API real, debounce de 300ms).
 * Los resultados se asocian a la consulta que los produjo, y `loading` se
 * deduce de esa comparación (sin `setState` síncrono en el efecto).
 */
export function useProductSearch(query: string) {
  const trimmed = query.trim();
  const [result, setResult] = useState<{
    query: string;
    products: Product[];
  } | null>(null);

  useEffect(() => {
    if (!trimmed) return;

    let active = true;
    const timeoutId = setTimeout(() => {
      productService
        .list({ search: trimmed, limit: 50, available: true })
        .then((resp) => {
          if (active) {
            setResult({
              query: trimmed,
              products:
                resp.code === 200 ? resp.data.items.map(toProduct) : [],
            });
          }
        })
        .catch(() => {
          if (active) setResult({ query: trimmed, products: [] });
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [trimmed]);

  const products = result?.query === trimmed ? result.products : [];
  const loading = trimmed !== '' && result?.query !== trimmed;

  return { products, loading };
}
