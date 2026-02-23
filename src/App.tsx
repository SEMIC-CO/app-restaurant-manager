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
  UsersListPage,
  UserCreatePage,
  AlertDemoPage
} from '@/features';
import { Toaster } from '@/components/ui';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        
        {/* App Routes */}
        <Route path="/" element={<POSPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/cocina" element={<KitchenPage />} />
        <Route path="/entregas" element={<DeliveryPage />} />
        <Route path="/facturacion" element={<BillingPage />} />
        <Route path="/facturacion/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="/reportes" element={<AnalyticsPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/productos/nuevo" element={<ProductCreatePage />} />
        
        {/* Settings Routes */}
        <Route path="/configuracion" element={<SettingsPage />} />
        <Route path="/configuracion/productos" element={<ProductsListPage />} />
        <Route path="/configuracion/usuarios" element={<UsersListPage />} />
        <Route path="/configuracion/usuarios/nuevo" element={<UserCreatePage />} />
        
        {/* Demo Routes */}
        <Route path="/demo/alerts" element={<AlertDemoPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
