import { useState, useEffect } from 'react';
import { productService } from '@/services';
import type { Product, Category } from '@/types';

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

/** Categorías del menú (empanadas, bebidas, combos, postres, entradas, salsas). */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productService
      .getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

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
