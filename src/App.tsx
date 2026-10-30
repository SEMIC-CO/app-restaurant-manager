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
  BillingPage,
  InvoiceDetailPage,
  ProfilePage,
  ProductCreatePage,
  SettingsPage,
  ProductsListPage,
  CategoriesListPage,
  UsersListPage,
  UserCreatePage,
  TablesListPage,
  EmployeesListPage,
  EmployeePayrollPage,
  AlertDemoPage,
  OrdersPage,
  OrderCreatePage,
  TablesPage,
} from '@/features';
import { Toaster } from '@/components/ui';
import { MobileSidebarDrawer, ProtectedRoute, PublicRoute } from '@/components/common';
import { useSessionBootstrap } from '@/hooks';

function App() {
  useSessionBootstrap();

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
          <Route path="/" element={<SettingsPage />} />
          <Route path="/mesas" element={<TablesPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/pedidos/nuevo" element={<OrderCreatePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cocina" element={<KitchenPage />} />
          <Route path="/entregas" element={<DeliveryPage />} />
          <Route path="/caja" element={<POSPage />} />
          <Route path="/facturacion" element={<BillingPage />} />
          <Route path="/facturacion/:invoiceId" element={<InvoiceDetailPage />} />
          <Route path="/reportes" element={<AnalyticsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/productos/nuevo" element={<ProductCreatePage />} />

          {/* Configuración */}
          <Route path="/configuracion/productos" element={<ProductsListPage />} />
          <Route path="/configuracion/categorias" element={<CategoriesListPage />} />
          <Route path="/configuracion/mesas" element={<TablesListPage />} />
          <Route path="/configuracion/empleados" element={<EmployeesListPage />} />
          <Route
            path="/configuracion/empleados/:employeeId/nomina"
            element={<EmployeePayrollPage />}
          />
          <Route path="/configuracion/usuarios" element={<UsersListPage />} />
          <Route path="/configuracion/usuarios/nuevo" element={<UserCreatePage />} />

          {/* Demo */}
          <Route path="/demo/alerts" element={<AlertDemoPage />} />
        </Route>
      </Routes>
      <MobileSidebarDrawer />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
