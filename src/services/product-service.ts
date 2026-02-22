import type { Product, Category } from '@/types';

// Mock data - replace with API calls
const mockCategories: Category[] = [
  { id: 'all', name: 'Todas', order: 0 },
  { id: 'empanadas', name: 'Empanadas', icon: '🥟', order: 1 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', order: 2 },
  { id: 'combos', name: 'Combos', icon: '🍽️', order: 3 },
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Empanada de Carne',
    description: 'Tradicional jugosa',
    price: 1.50,
    categoryId: 'empanadas',
    isAvailable: true,
    image: '/images/empanada-carne.jpg',
  },
  {
    id: '2',
    name: 'Empanada de Pollo',
    description: 'Pollo desmechado',
    price: 1.50,
    categoryId: 'empanadas',
    isAvailable: true,
    image: '/images/empanada-pollo.jpg',
  },
  {
    id: '3',
    name: 'Queso',
    description: 'Doble queso fundido',
    price: 1.20,
    categoryId: 'empanadas',
    isAvailable: true,
    image: '/images/empanada-queso.jpg',
  },
  {
    id: '4',
    name: 'Jamón y Queso',
    description: 'Clásico favorito',
    price: 1.30,
    categoryId: 'empanadas',
    isAvailable: true,
    image: '/images/empanada-jamon-queso.jpg',
  },
  {
    id: '5',
    name: 'Coca Cola',
    description: 'Lata 355ml',
    price: 1.00,
    categoryId: 'bebidas',
    isAvailable: true,
    image: '/images/coca-cola.jpg',
  },
  {
    id: '6',
    name: 'Jugo Natural',
    description: 'Naranja recién exprimida',
    price: 1.50,
    categoryId: 'bebidas',
    isAvailable: true,
    image: '/images/jugo-natural.jpg',
  },
  {
    id: '7',
    name: 'Arroz con Carne',
    description: 'Relleno abundante',
    price: 1.20,
    categoryId: 'empanadas',
    isAvailable: true,
    image: '/images/arroz-carne.jpg',
  },
  {
    id: '8',
    name: 'Combo Familiar',
    description: '3 Empanadas + Bebida',
    price: 4.00,
    categoryId: 'combos',
    isAvailable: true,
    image: '/images/combo-familiar.jpg',
  },
];

export const productService = {
  getCategories: async (): Promise<Category[]> => {
    // Simulate API call
    return Promise.resolve(mockCategories);
  },

  getProducts: async (): Promise<Product[]> => {
    return Promise.resolve(mockProducts);
  },

  getProductsByCategory: async (categoryId: string): Promise<Product[]> => {
    if (categoryId === 'all') {
      return Promise.resolve(mockProducts);
    }
    return Promise.resolve(
      mockProducts.filter(p => p.categoryId === categoryId)
    );
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const lowerQuery = query.toLowerCase();
    return Promise.resolve(
      mockProducts.filter(
        p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery)
      )
    );
  },
};
