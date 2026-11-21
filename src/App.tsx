import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ActivateAccountPage,
  POSPage,
  CheckoutPage,
  KitchenPage,
  DeliveryPage,
  AnalyticsPage,
  ExpensesPage,
  BillingPage,
  InvoiceDetailPage,
  ProfilePage,
  ProductFormPage,
  DashboardPage,
  ProductsListPage,
  CategoriesListPage,
  InventoryPage,
  UsersListPage,
  UserCreatePage,
  TablesListPage,
  EmployeesListPage,
  EmployeePayrollPage,
  NominaConfigPage,
  NominaPaymentsPage,
  ProfilesListPage,
  AlertDemoPage,
  OrdersPage,
  OrderCreatePage,
  TablesPage,
} from '@/features';
import { Toaster } from '@/components/ui';
import { MobileSidebarDrawer, ProtectedRoute, PublicRoute } from '@/components/common';
import { useSessionBootstrap, useNavigationBootstrap } from '@/hooks';
// import { PWABadge } from './components/pwa/pwa-badge';

function App() {
  useSessionBootstrap();
  useNavigationBootstrap();


  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
          <Route path="/activar-cuenta" element={<ActivateAccountPage />} />
        </Route>

        {/* Rutas privadas (requieren sesión) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/mesas" element={<TablesPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/pedidos/nuevo" element={<OrderCreatePage />} />
          <Route
            path="/pedidos/:orderId/editar"
            element={<OrderCreatePage />}
          />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cocina" element={<KitchenPage />} />
          <Route path="/entregas" element={<DeliveryPage />} />
          <Route path="/caja" element={<POSPage />} />
          <Route path="/facturacion" element={<BillingPage />} />
          <Route path="/facturacion/:invoiceId" element={<InvoiceDetailPage />} />
          <Route path="/reportes" element={<AnalyticsPage />} />
          <Route path="/gastos" element={<ExpensesPage />} />
          <Route path="/inventario" element={<InventoryPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/productos/nuevo" element={<ProductFormPage />} />
          <Route
            path="/productos/:productId/editar"
            element={<ProductFormPage />}
          />

          {/* Configuración */}
          <Route path="/configuracion/productos" element={<ProductsListPage />} />
          <Route path="/configuracion/categorias" element={<CategoriesListPage />} />
          <Route path="/configuracion/mesas" element={<TablesListPage />} />
          <Route path="/configuracion/empleados" element={<EmployeesListPage />} />
          <Route
            path="/configuracion/empleados/:employeeId/nomina"
            element={<EmployeePayrollPage />}
          />
          <Route path="/configuracion/nomina" element={<NominaConfigPage />} />
          <Route path="/configuracion/nomina/pagos" element={<NominaPaymentsPage />} />
          <Route path="/configuracion/usuarios" element={<UsersListPage />} />
          <Route path="/configuracion/usuarios/nuevo" element={<UserCreatePage />} />
          <Route
            path="/configuracion/usuarios/editar/:userId"
            element={<UserCreatePage />}
          />
          <Route path="/configuracion/perfiles" element={<ProfilesListPage />} />

          {/* Demo */}
          <Route path="/demo/alerts" element={<AlertDemoPage />} />
        </Route>
      </Routes>
      <MobileSidebarDrawer />
      <Toaster />
      {/* <PWABadge /> */}

    </BrowserRouter>
  );
}

export default App;
