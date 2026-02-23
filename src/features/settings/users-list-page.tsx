import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Switch,
} from '@/components/ui';
import { Plus, Search, Pencil, Trash2, Mail, Phone } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  roleName: string;
  username: string;
  isActive: boolean;
  lastLogin?: string;
}

// Mock data
const mockUsers: User[] = [
  { id: '1', fullName: 'Admin Usuario', email: 'admin@empanadapro.com', phone: '+52 123 456 7890', role: 'admin', roleName: 'Administrador', username: 'admin', isActive: true, lastLogin: 'Hace 2 horas' },
  { id: '2', fullName: 'Carlos Ramírez', email: 'carlos@empanadapro.com', phone: '+52 123 456 7891', role: 'manager', roleName: 'Gerente', username: 'carlos.ramirez', isActive: true, lastLogin: 'Hace 5 horas' },
  { id: '3', fullName: 'María González', email: 'maria@empanadapro.com', phone: '+52 123 456 7892', role: 'cashier', roleName: 'Cajero', username: 'maria.gonzalez', isActive: true, lastLogin: 'Hace 1 día' },
  { id: '4', fullName: 'Pedro Sánchez', email: 'pedro@empanadapro.com', phone: '+52 123 456 7893', role: 'kitchen', roleName: 'Cocina', username: 'pedro.sanchez', isActive: true, lastLogin: 'Hace 3 horas' },
  { id: '5', fullName: 'Ana Torres', email: 'ana@empanadapro.com', phone: '+52 123 456 7894', role: 'delivery', roleName: 'Delivery', username: 'ana.torres', isActive: true, lastLogin: 'Hace 30 min' },
  { id: '6', fullName: 'Luis Mendoza', email: 'luis@empanadapro.com', phone: '+52 123 456 7895', role: 'cashier', roleName: 'Cajero', username: 'luis.mendoza', isActive: false, lastLogin: 'Hace 7 días' },
];

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  cashier: 'bg-green-100 text-green-800',
  kitchen: 'bg-orange-100 text-orange-800',
  delivery: 'bg-pink-100 text-pink-800',
};

export function UsersListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.roleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = (userId: string, isActive: boolean) => {
    console.log('Toggle active:', userId, isActive);
    // TODO: Implement toggle active
  };

  const handleEdit = (userId: string) => {
    navigate(`/configuracion/usuarios/editar/${userId}`);
  };

  const handleDelete = (userId: string) => {
    console.log('Delete user:', userId);
    // TODO: Implement delete confirmation
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Usuarios del Sistema</h1>
                <p className="text-muted-foreground">
                  Administra usuarios y sus permisos de acceso
                </p>
              </div>
              <Button className="gap-2" onClick={() => navigate('/configuracion/usuarios/nuevo')}>
                <Plus className="h-4 w-4" />
                Nuevo Usuario
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o rol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
                        {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.fullName}</h3>
                        <Badge className={roleColors[user.role]}>
                          {user.roleName}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={(checked: boolean) =>
                        handleToggleActive(user.id, checked)
                      }
                    />
                  </div>

                  {/* User Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Usuario: <span className="font-medium">@{user.username}</span>
                    </div>
                    {user.lastLogin && (
                      <div className="text-xs text-muted-foreground">
                        Último acceso: {user.lastLogin}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleEdit(user.id)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:text-destructive"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="text-center">
                  <p className="text-2xl font-bold">{filteredUsers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {filteredUsers.filter(u => u.isActive).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {filteredUsers.filter(u => !u.isActive).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Inactivos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {filteredUsers.filter(u => u.role === 'admin').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredUsers.filter(u => u.role === 'manager').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Gerentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
