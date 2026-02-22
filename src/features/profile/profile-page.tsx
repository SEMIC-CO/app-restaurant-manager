import { useState } from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { ProfileLayout } from '@/app/layout/profile-layout';
import {
  ProfileSidebar,
  ProfileCard,
  ProductManagementCard,
  AdditionalConfigCard,
} from '@/components/profile';

// Mock data
const mockUser = {
  name: 'Juan Pérez',
  role: 'Administrador de Sucursal',
  email: 'juan.perez@empanadas.com',
  location: 'Bogotá, Colombia',
};

const mockProducts = [
  {
    id: '1',
    name: 'Empanada de Carne Tradicional',
    description: 'Rellena de carne picada, cebolla y especias',
    price: 2500,
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Empanada de Pollo y Arroz',
    description: 'Pechuga desmechada con arroz y vegetales',
    price: 2200,
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Jamón y Queso Especial',
    description: 'Doble queso fundido con jamón premium',
    price: 3000,
    isAvailable: false,
  },
];

/**
 * Profile and settings page
 */
export function ProfilePage() {
  const [products, setProducts] = useState(mockProducts);
  const [currentPage, setCurrentPage] = useState(1);

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const handleEditProfile = () => {
    console.log('Editing profile...');
  };

  const handleAddProduct = () => {
    console.log('Adding new product...');
  };

  const handleEditProduct = (productId: string) => {
    console.log('Editing product:', productId);
  };

  const handleDeleteProduct = (productId: string) => {
    console.log('Deleting product:', productId);
  };

  const handleToggleAvailability = (productId: string, isAvailable: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable } : p))
    );
  };

  const handleConfigClick = (configId: string) => {
    console.log('Opening config:', configId);
  };

  return (
    <ProfileLayout
      sidebar={<ProfileSidebar onLogout={handleLogout} />}
      header={
        <>
          <h1 className="text-lg font-semibold">Perfil y Configuración</h1>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="h-9 w-56 pl-10 pr-3"
              />
            </div>

            {/* Icons */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* User avatar */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            >
              <span className="text-sm">👤</span>
            </Button>
          </div>
        </>
      }
      main={
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Profile card */}
          <ProfileCard user={mockUser} onEdit={handleEditProfile} />

          {/* Product management */}
          <ProductManagementCard
            products={products}
            currentPage={currentPage}
            totalPages={2}
            totalProducts={15}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleAvailability={handleToggleAvailability}
            onPageChange={setCurrentPage}
          />

          {/* Additional config */}
          <AdditionalConfigCard onConfigClick={handleConfigClick} />
        </div>
      }
    />
  );
}
