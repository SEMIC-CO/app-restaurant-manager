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

// Sedes (API /headquarters) — alcance empresa del JWT
export interface Headquarters {
  id: number;
  name: string;
  address: string | null;
  companyId: number | null;
  countryId: number | null;
  departamentId: number | null;
  cityId: number | null;
}

export interface ListHeadquartersParams {
  page?: number;
  limit?: number;
  search?: string;
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
  /**
   * Artículo de inventario vinculado (`inventory_items.id`). Si tiene, vender
   * este producto genera una salida de stock. `null` = sin control de stock
   * (los platos).
   */
  inventoryItemId: number | null;
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
  /** Artículo de inventario asociado; `null` = sin control de stock. */
  inventoryItemId?: number | null;
}

export interface UpdateProductPayload {
  name?: string;
  categoryId?: number;
  price?: number;
  cost?: number;
  available?: boolean;
  description?: string;
  imageUrl?: string;
  /** `null` quita el vínculo con inventario. */
  inventoryItemId?: number | null;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  available?: boolean;
}

// Inventario (API /inventory)
/**
 * Tipos de movimiento de stock. Los valores viajan en **inglés** (check
 * constraint de la BD) y la UI los traduce con `INVENTORY_MOVEMENT_LABELS`.
 * `ENTRY`/`ADJUSTMENT_IN` suman stock; `EXIT`/`ADJUSTMENT_OUT` lo restan.
 */
export type InventoryMovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';

/** Categoría de inventario — alcance empresa del JWT. */
export interface ApiInventoryCategory {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  companyId: number;
}

export interface CreateInventoryCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateInventoryCategoryPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ListInventoryCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Artículo de inventario. El catálogo es global (la tabla no tiene empresa ni
 * sede); `currentStock` es el stock de la sede del JWT, calculado desde
 * `inventory_movements` por el backend.
 */
export interface ApiInventoryItem {
  id: number;
  inventoryCategoryId: number | null;
  code: string | null;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  /**
   * Costo unitario VIGENTE: promedio ponderado de las entradas. Lo calcula el
   * backend (no se digita). El precio de venta vive en `products.price`.
   */
  costPrice: number;
  trackInventory: boolean;
  isActive: boolean;
  currentStock?: number;
}

export interface CreateInventoryItemPayload {
  name: string;
  code?: string;
  description?: string;
  inventoryCategoryId?: number;
  unitOfMeasure?: string;
  trackInventory?: boolean;
  isActive?: boolean;
}

export interface UpdateInventoryItemPayload {
  name?: string;
  code?: string;
  description?: string;
  inventoryCategoryId?: number;
  unitOfMeasure?: string;
  trackInventory?: boolean;
  isActive?: boolean;
}

export interface ListInventoryItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  inventoryCategoryId?: number;
  isActive?: boolean;
}

/** Movimiento (kardex) de la sede del JWT, enriquecido con nombres. */
export interface ApiInventoryMovement {
  id: number;
  headquarterId: number;
  inventoryItemId: number;
  movementType: InventoryMovementType;
  quantity: number;
  /** Costo unitario: solo en las ENTRADAS (alimenta el costo vigente). */
  unitCost: number | null;
  /** Precio de venta: solo en las SALIDAS (sale price del producto). */
  unitPrice: number | null;
  reference: string | null;
  reason: string | null;
  createdBy: number | null;
  createdAt: string | null;
  /**
   * Anulación (`POST /inventory/movements/:id/void`): el movimiento sigue en
   * el kardex pero ya **no cuenta** ni para el stock ni para el costo vigente.
   * `voidedAt` con valor = anulado.
   */
  voidedAt: string | null;
  voidedBy: number | null;
  voidReason: string | null;
  /** Quién anuló (solo lo resuelve el listado; la creación no lo trae). */
  voidedByName?: string | null;
  itemName: string;
  createdByName: string | null;
}

export interface CreateInventoryMovementPayload {
  inventoryItemId: number;
  movementType: InventoryMovementType;
  /** Siempre positiva: el sentido lo da `movementType`. */
  quantity: number;
  unitCost?: number;
  /** Costo TOTAL del lote (p.ej. canasta de30): deriva `unitCost`. */
  totalCost?: number;
  /** Precio de venta unitario en las salidas. */
  unitPrice?: number;
  reference?: string;
  reason?: string;
}

export interface ListInventoryMovementsParams {
  page?: number;
  limit?: number;
  inventoryItemId?: number;
  movementType?: InventoryMovementType;
  /** Fecha `YYYY-MM-DD` (inclusive). */
  dateFrom?: string;
  /** Fecha `YYYY-MM-DD` (inclusive). */
  dateTo?: string;
  search?: string;
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

// ─── Dashboard (GET /reports/dashboard) ──────────────────────────────────────

/** Métricas de un día: pedidos **no cancelados** de la sede. */
export interface DaySalesSummary {
  /** Ingresos: Σ total de los pedidos del día (subtotal − descuento). */
  sales: number;
  /** Pedidos no cancelados creados en el día. */
  orders: number;
  /** Unidades vendidas. */
  units: number;
  /** Ventas ÷ pedidos (0 si no hubo pedidos). */
  avgTicket: number;
}

/**
 * Variación de cada KPI respecto al día anterior, en porcentaje con un
 * decimal. `null` cuando ayer no tuvo base (0), para no pintar deltas raros.
 */
export interface DashboardDelta {
  sales: number | null;
  orders: number | null;
  units: number | null;
  avgTicket: number | null;
}

export interface DashboardKpis {
  today: DaySalesSummary;
  yesterday: DaySalesSummary;
  delta: DashboardDelta;
}

/** Pedidos sin cobrar: los activos y los entregados pendientes de pago. */
export interface ActiveOrdersSummary {
  pending: number;
  preparing: number;
  ready: number;
  delivered: number;
  total: number;
}

/** Mesas ACTIVAS de la sede y cuántas están ocupadas. */
export interface TablesSummary {
  total: number;
  occupied: number;
  available: number;
}

/** Artículo sin stock vigente en la sede (stock ≤ 0). */
export interface StockAlert {
  id: number;
  name: string;
  unitOfMeasure: string;
  stock: number;
}

export interface DashboardAlerts {
  /** Hasta 10 artículos agotados. */
  outOfStock: StockAlert[];
  /** Facturas de la sede todavía sin cobrar. */
  pendingInvoices: number;
  /** Pedidos cancelados en el día. */
  cancelledOrders: number;
}

/** Pedido reciente del día (tabla "Últimos Movimientos"). */
export interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string | null;
  status: ApiOrderStatus;
  total: number;
  /** ISO desde la API; se pinta en hora local. */
  orderDatetime: string;
}

/** Snapshot del dashboard de la sede para un día. */
export interface DashboardReport {
  /** Día del reporte (`AAAA-MM-DD`). */
  date: string;
  kpi: DashboardKpis;
  activeOrders: ActiveOrdersSummary;
  tables: TablesSummary;
  products: ReportProductSales[];
  categoryMix: ReportCategoryMix[];
  alerts: DashboardAlerts;
  recentOrders: RecentOrder[];
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

// Nómina: configuración de pagos por empleado (API /payroll-templates)
/** Frecuencia de pago configurada en la plantilla de un empleado. */
export type ApiPayrollFrequency = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';

export const PAYROLL_FREQUENCY_LABELS: Record<ApiPayrollFrequency, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  FORTNIGHTLY: 'Quincenal',
  MONTHLY: 'Mensual',
};

/** Configuración de pago de un empleado (un único registro por empleado). */
export interface ApiPayrollTemplate {
  frequency: ApiPayrollFrequency;
  /** Monto base (subtotal) pagado en cada período. */
  baseAmount: number;
  notes: string | null;
  active: boolean;
}

/** Fila del listado: empleado + su configuración (`null` si no tiene). */
export interface ApiPayrollTemplateRow {
  employeeId: number;
  employeeName: string;
  employeeActive: boolean;
  template: ApiPayrollTemplate | null;
}

export interface UpsertPayrollTemplatePayload {
  frequency: ApiPayrollFrequency;
  baseAmount: number;
  notes?: string | null;
  active?: boolean;
}

/** Ajuste aplicado a un cálculo previo de nómina. */
export interface PreviewAdjustmentRow {
  id: number;
  concept: string;
  adjustmentValue: number;
}

/** Fila del cálculo previo: lo que se sugerirá pagar a un empleado. */
export interface ApiPayrollPreviewRow {
  employeeId: number;
  employeeName: string;
  frequency: ApiPayrollFrequency;
  /** Período PROPIO del empleado, derivado de su frecuencia. */
  periodStartDate: string;
  periodEndDate: string;
  subtotal: number;
  bonuses: number;
  advances: number;
  deductions: number;
  totalPaid: number;
  adjustments: PreviewAdjustmentRow[];
  /**
   * `true` si ya existe un pago para este empleado en SU período: se muestra
   * marcado como pagado y no se vuelve a pagar.
   */
  alreadyPaid: boolean;
}

export interface PreviewPayrollPayload {
  /** Fecha de referencia: cada empleado resuelve su período a partir de ella. */
  referenceDate: string;
  /** Restringe el cálculo a estos empleados; si se omite, a todos. */
  employeeIds?: number[];
}

// Usuarios (API /users) — alcance empresa del JWT
export type ApiUserStatus = 'ACTIVO' | 'INACTIVO';

/**
 * Usuario del backend (`users`). Sin contraseña ni hash; el nombre del perfil
 * NO viene en la respuesta, se resuelve cruzando `profileId` con
 * `GET /profiles`.
 */
export interface ApiUser {
  id: number;
  name: string;
  email: string;
  telephone: string | null;
  isOwner: boolean;
  companyId: number | null;
  profileId: number;
  headquarterId: number | null;
  status: ApiUserStatus;
  acceptTerms: boolean;
  acceptPolicies: boolean;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

/** `password` es obligatorio solo al crear; la sede la define la empresa. */
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  telephone?: string;
  profileId: number;
  headquarterId: number;
  isOwner?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  telephone?: string;
  profileId?: number;
  headquarterId?: number;
  isOwner?: boolean;
  /**
   * Activa/desactiva la cuenta. El backend rechaza cambiarte a ti mismo
   * (`403`: te dejaría sin poder iniciar sesión).
   */
  status?: ApiUserStatus;
}

// Perfiles de usuario (API /profiles) — alcance empresa del JWT
/**
 * Perfil: `SYSTEM` lo creó la plataforma (no se edita ni se borra, el
 * backend responde `403`); `COMPANY` lo creó la empresa del token.
 */
export type ApiProfileType = 'SYSTEM' | 'COMPANY';

export interface ApiProfile {
  id: number;
  /** Nombre del perfil (máx. 50). */
  profile: string;
  type: ApiProfileType;
  companyId: number;
}

export interface CreateProfilePayload {
  profile: string;
}

export interface UpdateProfilePayload {
  profile?: string;
}

// Navegación (API /menus, /submenus, /permissions) — catálogo global
/**
 * Menú de primer nivel. `groupName` es el bloque del sidebar
 * (`PRINCIPAL`, `CONFIGURACIÓN`, `SISTEMA`); el `icon` es el nombre del
 * icono de `lucide-react` que el frontend resuelve con `NavIcon`.
 */
export interface ApiMenu {
  id: number;
  menu: string;
  icon: string;
  path: string;
  groupName: string | null;
  createdBy: number;
}

/** Submenú: página anidada dentro de un menú. */
export interface ApiSubmenu {
  id: number;
  submenu: string;
  icon: string;
  path: string;
  menuId: number;
  groupName: string;
  createdBy: number;
}

/** Permiso: al menos uno de `menuId`, `submenuId` o `actionId` viene informado. */
export interface ApiPermission {
  id: number;
  menuId: number | null;
  submenuId: number | null;
  actionId: number | null;
}

export interface ApiNavigationSubmenu {
  id: number;
  submenu: string;
  icon: string;
  path: string;
  groupName: string;
}

export interface ApiNavigationMenu {
  id: number;
  menu: string;
  icon: string;
  path: string;
  groupName: string | null;
  submenus: ApiNavigationSubmenu[];
}

/** Respuesta de `GET /menus/mine`: sidebar del perfil del JWT. */
export interface ApiNavigation {
  /** `true` para el perfil ADMINISTRADOR: ve todo el catálogo. */
  isAdmin: boolean;
  menus: ApiNavigationMenu[];
}

// Pago de nómina en lote (API /payments-employees/batch)
export interface BatchPaymentItem {
  employeeId: number;
  /** Período PROPIO del empleado; si falta, usa el rango general del lote. */
  periodStartDate?: string;
  periodEndDate?: string;
  subtotal: number;
  totalAdvances: number;
  totalDeductions: number;
  totalPaid: number;
  notes?: string | null;
}

export interface CreatePaymentsBatchPayload {
  /** Rango general: respaldo para las filas que no traen sus propias fechas. */
  periodStartDate?: string;
  periodEndDate?: string;
  paymentDate?: string;
  status?: 'DRAFT' | 'PAID';
  notes?: string | null;
  items: BatchPaymentItem[];
}

export interface BatchPaymentSkipped {
  employeeId: number;
  reason: string;
}

export interface BatchPaymentResult {
  created: ApiPaymentEmployee[];
  skipped: BatchPaymentSkipped[];
  /** Cantidad de ajustes pendientes pasados a `APPLIED`. */
  adjustmentsApplied: number;
}

/**
 * Fila del historial de pagos de la sede (`GET /payments-employees/history`):
 * el pago con el nombre de quien lo recibió.
 */
export interface ApiPaymentHistoryRow extends ApiPaymentEmployee {
  employeeName: string;
  /**
   * Frecuencia derivada del ancho del período: 'Diaria' | 'Semanal' |
   * 'Quincenal' | 'Mensual', o `null` si el rango no encaja con ninguna.
   */
  frequencyLabel: string | null;
}

export interface ListPaymentHistoryParams {
  page?: number;
  limit?: number;
  status?: ApiPaymentEmployeeStatus;
  /** Filtro sobre `periodStartDate` (inclusive). */
  dateFrom?: string;
  /** Filtro sobre `periodStartDate` (inclusive). */
  dateTo?: string;
}
