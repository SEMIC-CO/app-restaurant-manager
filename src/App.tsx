import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage, RegisterPage, POSPage, CheckoutPage, KitchenPage, DeliveryPage, AnalyticsPage, BillingPage, InvoiceDetailPage, ProfilePage } from '@/features';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        
        {/* App Routes */}
        <Route path="/" element={<POSPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/cocina" element={<KitchenPage />} />
        <Route path="/entregas" element={<DeliveryPage />} />
        <Route path="/facturacion" element={<BillingPage />} />
        <Route path="/facturacion/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="/reportes" element={<AnalyticsPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
