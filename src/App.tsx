import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
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
  AlertDemoPage,
  OrdersPage,
  TablesPage,
} from '@/features';
import { Toaster } from '@/components/ui';
import { MobileSidebarDrawer } from '@/components/common';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />

        {/* App Routes */}
        <Route path="/mesas" element={<TablesPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/cocina" element={<KitchenPage />} />
        <Route path="/entregas" element={<DeliveryPage />} />
        <Route path="/caja" element={<POSPage />} />
        <Route path="/facturacion" element={<BillingPage />} />
        <Route path="/facturacion/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="/reportes" element={<AnalyticsPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/productos/nuevo" element={<ProductCreatePage />} />

        {/* Settings Routes */}
        <Route path="/" element={<SettingsPage />} />
        <Route path="/configuracion/productos" element={<ProductsListPage />} />
        <Route path="/configuracion/categorias" element={<CategoriesListPage />} />
        <Route path="/configuracion/usuarios" element={<UsersListPage />} />
        <Route path="/configuracion/usuarios/nuevo" element={<UserCreatePage />} />

        {/* Demo Routes */}
        <Route path="/demo/alerts" element={<AlertDemoPage />} />
      </Routes>
      <MobileSidebarDrawer />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
