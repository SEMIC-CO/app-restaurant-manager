import type { Product, Category, CategoryType, Table } from '@/types';

const productCategories: Category[] = [
  { id: 'all', name: 'Todas', order: 0 },
  { id: 'empanadas', name: 'Empanadas', icon: '🥟', order: 1 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', order: 2 },
  { id: 'combos', name: 'Combos', icon: '🍽️', order: 3 },
  { id: 'postres', name: 'Postres', icon: '🍰', order: 4 },
  { id: 'entradas', name: 'Entradas', icon: '🥗', order: 5 },
  { id: 'salsas', name: 'Salsas', icon: '🥫', order: 6 },
];

const tableCategories: Category[] = [
  { id: 'all', name: 'Todas', order: 0 },
  { id: 'principal', name: 'Principal', icon: '🏠', order: 1 },
  { id: 'terraza-bar', name: 'Terraza Bar', icon: '🌿', order: 2 },
  { id: 'segundo-piso', name: 'Segundo Piso', icon: '🪜', order: 3 },
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

const mockTables: Table[] = [
  { id: 't1', number: 1, categoryId: 'principal', capacity: 4, status: 'available' },
  { id: 't2', number: 2, categoryId: 'principal', capacity: 2, status: 'occupied', orderNumber: '#ORD-3940', customerName: 'Carlos Ruiz' },
  { id: 't3', number: 3, categoryId: 'principal', capacity: 6, status: 'available' },
  { id: 't4', number: 4, categoryId: 'principal', capacity: 4, status: 'reserved', customerName: 'Reservado: Familia Gómez' },
  { id: 't5', number: 5, categoryId: 'principal', capacity: 2, status: 'available' },
  { id: 't6', number: 6, categoryId: 'principal', capacity: 8, status: 'occupied', orderNumber: '#ORD-3942' },
  { id: 't7', number: 7, categoryId: 'principal', capacity: 4, status: 'available' },
  { id: 't8', number: 8, categoryId: 'principal', capacity: 2, status: 'available' },

  { id: 'tb1', number: 1, name: 'Terraza 1', categoryId: 'terraza-bar', capacity: 4, status: 'occupied', icon: '🌿', orderNumber: '#ORD-3941', customerName: 'María Fernández' },
  { id: 'tb2', number: 2, name: 'Terraza 2', categoryId: 'terraza-bar', capacity: 4, status: 'available', icon: '🌿' },
  { id: 'tb3', number: 3, name: 'Bar 1', categoryId: 'terraza-bar', capacity: 1, status: 'available', icon: '🍺' },
  { id: 'tb4', number: 4, name: 'Bar 2', categoryId: 'terraza-bar', capacity: 1, status: 'occupied', icon: '🍺', orderNumber: '#ORD-3938' },
  { id: 'tb5', number: 5, name: 'Terraza 3', categoryId: 'terraza-bar', capacity: 6, status: 'available', icon: '🌿' },
  { id: 'tb6', number: 6, name: 'Terraza 4', categoryId: 'terraza-bar', capacity: 4, status: 'reserved', icon: '🌿', customerName: 'Reservado: Juan Pérez' },
  { id: 'tb7', number: 7, name: 'Bar 3', categoryId: 'terraza-bar', capacity: 1, status: 'available', icon: '🍺' },

  { id: 'ts1', number: 1, name: 'Piso 2 - 1', categoryId: 'segundo-piso', capacity: 4, status: 'available', icon: '🪟' },
  { id: 'ts2', number: 2, name: 'Piso 2 - 2', categoryId: 'segundo-piso', capacity: 2, status: 'available', icon: '🪟' },
  { id: 'ts3', number: 3, name: 'Piso 2 - 3', categoryId: 'segundo-piso', capacity: 10, status: 'occupied', icon: '🪟', orderNumber: '#ORD-3939', customerName: 'Grupo empresarial' },
  { id: 'ts4', number: 4, name: 'Piso 2 - 4', categoryId: 'segundo-piso', capacity: 6, status: 'available', icon: '🪟' },
  { id: 'ts5', number: 5, name: 'Privada VIP', categoryId: 'segundo-piso', capacity: 12, status: 'reserved', icon: '🔐', customerName: 'Reservado VIP' },
];

export const productService = {
  getCategories: async (): Promise<Category[]> => {
    return Promise.resolve(productCategories);
  },

  getCategoriesByType: async (type: CategoryType): Promise<Category[]> => {
    const data = type === 'mesas' ? tableCategories : productCategories;
    return Promise.resolve(data);
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

  getTables: async (categoryId: string = 'all'): Promise<Table[]> => {
    if (categoryId === 'all') return Promise.resolve(mockTables);
    return Promise.resolve(mockTables.filter((t) => t.categoryId === categoryId));
  },
};
