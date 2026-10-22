// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  categoryId: string;
  isAvailable: boolean;
  stock?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  order: number;
}

export type CategoryType = 'productos' | 'mesas';

// Order Types
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  type: OrderType;
  tableNumber?: number;
  customerName?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number; // in minutes
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'paid'
  | 'cancelled';

export type OrderType =
  | 'dine-in'
  | 'takeout'
  | 'delivery';

// Payment Types
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
}

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'qr';

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

// User Types
export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type UserRole =
  | 'admin'
  | 'cashier'
  | 'kitchen';

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// API Types (backend)
export interface ApiResponse<T> {
  code: number;
  msg: string;
  transactionId: string;
  timestamp: string;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Ubicaciones (API /locations)
export interface Country {
  id: number;
  name: string;
}

export interface Departament {
  id: number;
  name: string;
  code: number | null;
  countryId: number | null;
}

export interface City {
  id: number;
  name: string;
  departamentId: number | null;
  codeCity: string | null;
}

// Registro (API /auth/register)
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  telephone?: string;
  companyName: string;
  companyAddress?: string;
  countryId?: number;
  departamentId?: number;
  cityId?: number;
}

export interface RegisterResponse {
  userId: number;
  companyId: number;
  headquarterId: number;
  name: string;
  email: string;
  companyName: string;
}

// Activación de cuenta (API /auth)
export interface ActivateAccountPayload {
  token: string;
}

export interface ResendActivationPayload {
  email: string;
}

export interface MessageResponse {
  message: string;
}

// Sesión (API /auth/login y /auth/refresh)
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  companyId: number | null;
  profileId: number;
  headquarterId: number | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

// Shift Types
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

// Table (mesa del local) Types
export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  number: number;
  name?: string;
  categoryId: string; // 'principal' | 'terraza-bar' | 'segundo-piso' | etc
  capacity: number;
  status: TableStatus;
  orderNumber?: string; // si está ocupada/reservada
  customerName?: string; // si está ocupada
  icon?: string; // emoji/icono personalizado para el tipo de mesa
}
