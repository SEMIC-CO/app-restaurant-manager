import { useState, useEffect } from 'react';
import { productService } from '@/services';
import type { Product, Category, CategoryType, Table } from '@/types';

export function useProducts(categoryId: string = 'all') {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    productService
      .getProductsByCategory(categoryId)
      .then(setProducts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [categoryId]);

  return { products, loading, error };
}

/**
 * Hook reutilizable de categorías tipado por tipo.
 *
 * @param type Obligatorio.
 *  - 'productos' → categorías del menú (empanadas, bebidas, combos, postres, entradas, salsas)
 *  - 'mesas'     → áreas / zonas de mesas (Principal, Terraza Bar, Segundo Piso)
 */
export function useCategories(type: CategoryType) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productService
      .getCategoriesByType(type)
      .then(setCategories)
      .finally(() => setLoading(false));
  }, [type]);

  return { categories, loading };
}

export function useProductSearch(query: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(() => {
      productService
        .searchProducts(query)
        .then(setProducts)
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return { products, loading };
}

export function useTables(categoryId: string = 'all') {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    productService
      .getTables(categoryId)
      .then(setTables)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [categoryId]);

  return { tables, loading, error };
}


