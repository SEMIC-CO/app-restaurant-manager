import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import {
  Card,
  CardContent,
  Button,
  Badge
} from '@/components/ui';
import {
  Package,
  ShoppingBag,
  Users,
  FileDown,
  Plus,
  Edit
} from 'lucide-react';

interface RecentActivity {
  id: string;
  name: string;
  type: 'Producto' | 'Categoría' | 'Nuevo Usuario';
  date: string;
  status: 'ACTIVO' | 'SIN STOCK';
  icon: string;
}

export function SettingsPage() {
  const navigate = useNavigate();

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      name: 'Empanada de Carne Picante',
      type: 'Producto',
      date: 'Hoy, 14:20',
      status: 'ACTIVO',
      icon: '🥟',
    },
    {
      id: '2',
      name: 'Empanadas Veganas',
      type: 'Categoría',
      date: 'Hoy, 11:05',
      status: 'ACTIVO',
      icon: '🥕',
    },
    {
      id: '3',
      name: 'Empanada de Humita',
      type: 'Producto',
      date: 'Ayer, 18:45',
      status: 'SIN STOCK',
      icon: '🥟',
    },
    {
      id: '4',
      name: 'Juan Pérez',
      type: 'Nuevo Usuario',
      date: 'Ayer, 09:12',
      status: 'ACTIVO',
      icon: '👤',
    },
    {
      id: '5',
      name: 'Empanada J&Q (Horneada)',
      type: 'Producto',
      date: '22 Oct, 16:30',
      status: 'ACTIVO',
      icon: '🥟',
    },
  ];

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Header: la misma barra (con su padding) que el resto de módulos */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">PANEL DE CONFIGURACIÓN</h1>
                <p className="text-muted-foreground">
                  Bienvenido al centro de control de tu negocio de empanadas.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exportar Reporte
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Nueva Venta
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Productos Card */}
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-lg bg-orange-100 p-3">
                    <Package className="h-8 w-8 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600">
                    +12 este mes
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Productos</p>
                  <p className="text-4xl font-bold">124 <span className="text-sm font-normal text-muted-foreground">Items</span></p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                    onClick={() => navigate('/configuracion/productos')}
                  >
                    VER TODOS
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    onClick={() => navigate('/productos/nuevo')}
                  >
                    CREAR NUEVO
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Categorías Card */}
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-lg bg-orange-100 p-3">
                    <ShoppingBag className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categorías</p>
                  <p className="text-4xl font-bold">12 <span className="text-sm font-normal text-muted-foreground">Activas</span></p>
                </div>
                <div className="mt-4">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => navigate('/configuracion/categorias')}
                  >
                    ADMINISTRAR
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Usuarios Card */}
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-lg bg-blue-100 p-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600">
                    3 Online
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuarios</p>
                  <p className="text-4xl font-bold">08 <span className="text-sm font-normal text-muted-foreground">Empleados</span></p>
                </div>
                <div className="mt-4">
                  <Button
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={() => navigate('/configuracion/usuarios')}
                  >
                    GESTIONAR USUARIOS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-bold">Últimos Movimientos</h2>
                <Button variant="link" className="text-primary">
                  Ver registro completo
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Item / Acción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentActivities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-lg">
                              {activity.icon}
                            </div>
                            <span className="font-medium">{activity.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{activity.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{activity.date}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={activity.status === 'ACTIVO' ? 'default' : 'secondary'}
                            className={
                              activity.status === 'ACTIVO'
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                            }
                          >
                            {activity.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
