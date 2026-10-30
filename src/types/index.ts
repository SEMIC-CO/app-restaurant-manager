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

// Order Types
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  /** Imagen miniatura del producto (si la tiene); se usa en las filas del carrito. */
  productImage?: string;
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
  /** Nombre de la mesa ("Mesa 2") o legado numérico ("5"). Ver `formatTableLabel`. */
  tableNumber?: string;
  customerName?: string;
  /** Notas libres del pedido (columna `orders.notes`). */
  notes?: string;
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
  | 'para-llevar'
  | 'mesa'
  | 'domicilio';

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

// Secciones y Mesas (API /sections y /tables) — alcance sede del JWT
export interface Section {
  id: number;
  name: string;
  headquarterId: number;
  createdBy: number;
}

/** Estado de activación de la mesa (columna `status` de la BD: ACTIVO/INACTIVO). */
export type TableActiveStatus = 'ACTIVO' | 'INACTIVO';

/**
 * Estado de ocupación de la mesa. SOLO existe en el front: se deriva de las
 * órdenes activas (pending/preparing/ready) cruzadas por `idTable`.
 */
export type FloorTableStatus = 'available' | 'occupied';

export interface RestaurantTable {
  id: number;
  name: string;
  cantPeople: number;
  sectionId: number;
  createdBy: number;
  status: TableActiveStatus;
}

/**
 * Mesa de piso/pedidos: `RestaurantTable` enriquecida con la sección y con
 * el estado de ocupación derivado de las órdenes activas.
 */
export interface FloorTable {
  id: number;
  name: string;
  cantPeople: number;
  sectionId: number;
  sectionName: string;
  status: TableActiveStatus;
  floorStatus: FloorTableStatus;
  orderNumber?: string;
  customerName?: string;
}

export interface CreateSectionPayload {
  name: string;
}

export interface UpdateSectionPayload {
  name?: string;
}

export interface CreateTablePayload {
  name: string;
  cantPeople: number;
  sectionId: number;
  status?: TableActiveStatus;
}

export interface UpdateTablePayload {
  name?: string;
  cantPeople?: number;
  sectionId?: number;
  status?: TableActiveStatus;
}

export interface ListSectionsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListTablesParams extends ListSectionsParams {
  sectionId?: number;
  status?: TableActiveStatus;
}

// Categorías (API /categories) — alcance sede del JWT
/**
 * Categoría del backend (`categories`). A diferencia del tipo `Category` del
 * catálogo mock, el backend expone `color` y `active` (sin icono ni orden).
 */
export interface ApiCategory {
  id: number;
  name: string;
  color: string | null;
  active: boolean;
  headquarterId: number | null;
  userId: number | null;
}

export interface CreateCategoryPayload {
  name: string;
  color?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  color?: string;
  active?: boolean;
}

export interface ListCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

// Productos (API /products) — alcance sede del JWT
/**
 * Producto del backend (`products`). A diferencia del tipo `Product` del
 * catálogo mock, los ids son numéricos y la imagen se guarda como **ruta
 * relativa** en `imageUrl` (`productos/prod-<uuid>.webp`): para mostrarla usa
 * `resolveStorageUrl()`.
 */
export interface ApiProduct {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  cost: number;
  available: boolean | null;
  description: string | null;
  imageUrl: string | null;
  headquarterId: number | null;
  userId: number | null;
}

export interface CreateProductPayload {
  name: string;
  categoryId: number;
  price: number;
  cost: number;
  available?: boolean;
  description?: string;
  /** URL externa opcional; la imagen del formulario viaja aparte (multipart). */
  imageUrl?: string;
}

export interface UpdateProductPayload {
  name?: string;
  categoryId?: number;
  price?: number;
  cost?: number;
  available?: boolean;
  description?: string;
  imageUrl?: string;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  available?: boolean;
}

// Órdenes (API /orders)
export type ApiOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';

export interface ApiOrderItem {
  id: number | null;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ApiOrder {
  id: number;
  orderNumber: string;
  customerName: string | null;
  tableNumber: string | null;
  status: ApiOrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  orderDatetime: string;
  paymentMethod: string | null;
  notes: string | null;
  headquarterId: number | null;
  userId: number | null;
  idTable: number | null;
  /** Etiqueta del tipo: 'Mesa' | 'Para Llevar' | 'Domicilio'. */
  orderType?: string;
  /** Entrega a domicilio (solo presentes en ese tipo de orden). */
  address?: string | null;
  customerPhone?: string | null;
  items: ApiOrderItem[];
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: ApiOrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateOrderPayload {
  customerName?: string;
  tableNumber?: string;
  idTable?: number;
  discount?: number;
  notes?: string;
  items: { productId: number; quantity: number }[];
  orderType?: OrderType;
  /** Opcionales; se envían con `orderType: 'domicilio'` (vacío → null). */
  address?: string;
  customerPhone?: string;
}

export interface UpdateOrderPayload {
  status?: ApiOrderStatus;
  customerName?: string;
  tableNumber?: string;
  /** `null` limpia la mesa (cambio de tipo de pedido). */
  idTable?: number | null;
  discount?: number;
  paymentMethod?: string;
  notes?: string;
  orderType?: OrderType;
  address?: string;
  customerPhone?: string;
}

/** Estado de la factura (`invoices.status`): pendiente de emitir, emitida (DIAN) o anulada. */
export type ApiInvoiceStatus = 'pending' | 'emitted' | 'cancelled';

/** Método de pago que acepta `invoices.payment_method` (BD: CHECK propio). */
export type InvoicePaymentMethod = 'Cash' | 'Card' | 'Transfer';

/** Factura generada (`POST /invoices`, `GET /invoices/:id`). */
export interface ApiInvoice {
  id: number;
  orderId: number;
  invoiceNumber: string;
  customerName: string | null;
  customerIdentification: string | null;
  customerEmail: string | null;
  invoiceDatetime: string;
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  /** Propina voluntaria: no forma parte de `total`. */
  voluntaryTip: number;
  paymentMethod: string | null;
  status: ApiInvoiceStatus;
  companyId: number | null;
  userId: number | null;
}

/** Payload de `POST /invoices` (solo `orderId` es obligatorio). */
export interface CreateInvoicePayload {
  orderId: number;
  customerName?: string;
  customerIdentification?: string;
  customerEmail?: string;
  taxes?: number;
  voluntaryTip?: number;
  paymentMethod?: InvoicePaymentMethod;
  status?: ApiInvoiceStatus;
}

/** Query de `GET /invoices` (fechas en formato `AAAA-MM-DD`). */
export interface ListInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApiInvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
}

// ─── Reportes (GET /reports/sales) ───────────────────────────────────────────

/** Producto con sus ventas en el período del reporte. */
export interface ReportProductSales {
  productId: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  /** Unidades vendidas. */
  units: number;
  /** Ingresos (Σ subtotales de línea). */
  revenue: number;
}

/** Participación de una categoría sobre las unidades vendidas del período. */
export interface ReportCategoryMix {
  categoryId: number | null;
  name: string;
  color: string | null;
  units: number;
  /** Porcentaje (0–100). */
  percentage: number;
}

/** Reporte de ventas de la sede (`GET /reports/sales`). */
export interface SalesReport {
  range: {
    dateFrom: string | null;
    dateTo: string | null;
  };
  summary: {
    /** Pedidos no cancelados creados en el período. */
    totalOrders: number;
    /** Unidades vendidas en el período. */
    totalUnits: number;
    topProduct: ReportProductSales | null;
    lowestProduct: ReportProductSales | null;
  };
  /** Ranking y detalle: productos con ventas, de mayor a menor. */
  products: ReportProductSales[];
  /** Distribución de unidades por categoría. */
  categoryMix: ReportCategoryMix[];
}

// Empleados (API /employees) — alcance sede del JWT
/** Empleado del backend (`employees`). */
export interface ApiEmployee {
  id: number;
  noDocument: string | null;
  name: string;
  phone: string;
  email: string | null;
  /** Fecha `YYYY-MM-DD` o `null`. */
  birthdate: string | null;
  active: boolean;
  headquarterId: number | null;
}

export interface CreateEmployeePayload {
  noDocument?: string;
  name: string;
  phone: string;
  /** `null` limpia el correo. */
  email?: string | null;
  /** `YYYY-MM-DD`; `null` limpia la fecha. */
  birthdate?: string | null;
  active?: boolean;
}

export interface UpdateEmployeePayload {
  noDocument?: string | null;
  name?: string;
  phone?: string;
  email?: string | null;
  birthdate?: string | null;
  active?: boolean;
}

export interface ListEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

// Pagos de empleados (API /payments-employees) — alcance sede vía empleado
export type ApiPaymentEmployeeStatus = 'DRAFT' | 'PAID' | 'VOIDED';

export interface ApiPaymentEmployee {
  id: number;
  periodStartDate: string;
  periodEndDate: string;
  /** ISO 8601. */
  paymentDate: string;
  subtotal: number;
  totalAdvances: number;
  totalDeductions: number;
  /** Columna `total_payd`. */
  totalPaid: number;
  notes: string | null;
  status: ApiPaymentEmployeeStatus;
  employeeId: number;
}

export interface CreatePaymentEmployeePayload {
  employeeId: number;
  periodStartDate: string;
  periodEndDate: string;
  subtotal: number;
  totalAdvances: number;
  totalDeductions: number;
  totalPaid: number;
  paymentDate?: string;
  notes?: string | null;
  /** `VOIDED` solo se alcanza con `DELETE`. */
  status?: 'DRAFT' | 'PAID';
}

export interface UpdatePaymentEmployeePayload {
  periodStartDate?: string;
  periodEndDate?: string;
  paymentDate?: string;
  subtotal?: number;
  totalAdvances?: number;
  totalDeductions?: number;
  totalPaid?: number;
  notes?: string | null;
  status?: 'DRAFT' | 'PAID';
}

export interface ListPaymentEmployeesParams {
  employeeId: number;
  page?: number;
  limit?: number;
  status?: ApiPaymentEmployeeStatus;
}

// Ajustes de nómina (API /payroll-adjustments) — alcance sede vía empleado
export type ApiPayrollAdjustmentStatus = 'EARRING' | 'APPLIED' | 'CANCELLED';

export interface ApiPayrollAdjustment {
  id: number;
  /** Columna `concepto`. */
  concept: string;
  /** Positivo suma al pago, negativo lo descuenta. */
  adjustmentValue: number;
  description: string | null;
  employeeId: number;
  status: ApiPayrollAdjustmentStatus;
}

export interface CreatePayrollAdjustmentPayload {
  employeeId: number;
  concept: string;
  adjustmentValue: number;
  description?: string | null;
  status?: 'EARRING' | 'APPLIED';
}

export interface UpdatePayrollAdjustmentPayload {
  concept?: string;
  adjustmentValue?: number;
  description?: string | null;
  status?: ApiPayrollAdjustmentStatus;
}

export interface ListPayrollAdjustmentsParams {
  employeeId: number;
  page?: number;
  limit?: number;
  status?: ApiPayrollAdjustmentStatus;
}
