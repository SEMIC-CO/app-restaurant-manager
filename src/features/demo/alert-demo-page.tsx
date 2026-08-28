import { DashboardLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import { toast } from '@/hooks';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Zap,
  ShoppingCart,
  UserCheck,
  Bell,
} from 'lucide-react';

export function AlertDemoPage() {
  return (
    <DashboardLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-3xl font-bold">Sistema de Notificaciones</h1>
            <p className="text-muted-foreground mt-2">
              Ejemplos de uso del componente Alert (estático) y Toast (dinámico) según shadcn/ui
            </p>
          </div>

          {/* Toast Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Toast Notifications (Dinámicas)
              </CardTitle>
              <CardDescription>
                Notificaciones temporales que aparecen automáticamente en la esquina de la pantalla
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  onClick={() =>
                    toast({
                      variant: 'success',
                      title: '✅ Producto guardado',
                      description: 'El producto se ha creado correctamente.',
                    })
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Toast de Éxito
                </Button>

                <Button
                  onClick={() =>
                    toast({
                      variant: 'destructive',
                      title: '❌ Error al procesar',
                      description: 'No se pudo completar la operación. Intente nuevamente.',
                    })
                  }
                  variant="destructive"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Toast de Error
                </Button>

                <Button
                  onClick={() =>
                    toast({
                      variant: 'warning',
                      title: '⚠️ Stock bajo',
                      description: 'El inventario del producto está por terminar (5 unidades).',
                    })
                  }
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Toast de Advertencia
                </Button>

                <Button
                  onClick={() =>
                    toast({
                      variant: 'info',
                      title: 'ℹ️ Actualización disponible',
                      description: 'Hay una nueva versión del sistema disponible.',
                    })
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Toast de Info
                </Button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Casos de uso reales:</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button
                    onClick={() =>
                      toast({
                        variant: 'success',
                        title: 'Pedido completado',
                        description: 'Orden #1234 - Total: $45.50',
                      })
                    }
                    variant="outline"
                    className="justify-start"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Pedido completado
                  </Button>

                  <Button
                    onClick={() =>
                      toast({
                        variant: 'success',
                        title: 'Usuario creado',
                        description: 'El nuevo usuario tiene acceso al sistema.',
                      })
                    }
                    variant="outline"
                    className="justify-start"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Usuario registrado
                  </Button>

                  <Button
                    onClick={() =>
                      toast({
                        variant: 'info',
                        title: 'Nueva orden en cocina',
                        description: 'Mesa 8 - 3 empanadas de carne',
                      })
                    }
                    variant="outline"
                    className="justify-start"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Nueva orden
                  </Button>

                  <Button
                    onClick={() =>
                      toast({
                        variant: 'warning',
                        title: 'Orden retrasada',
                        description: 'Orden #789 lleva más de 15 minutos',
                      })
                    }
                    variant="outline"
                    className="justify-start"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Alerta de tiempo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Static Alerts Section */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Components (Estáticas)</CardTitle>
              <CardDescription>
                Alertas permanentes que se muestran en la página
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Alert */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Basic</h3>
                <Alert>
                  <CheckCircle2 />
                  <AlertTitle>Payment successful</AlertTitle>
                  <AlertDescription>
                    Your payment of $29.99 has been processed. A receipt has been sent to your email address.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Destructive Alert */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Destructive</h3>
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Payment failed</AlertTitle>
                  <AlertDescription>
                    Your payment could not be processed. Please check your payment method and try again.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Alert with Action */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">With Action</h3>
                <Alert>
                  <Info />
                  <AlertTitle>Dark mode is now available</AlertTitle>
                  <AlertDescription>
                    Enable it under your profile settings to get started.
                  </AlertDescription>
                  <AlertAction>
                    <Button size="sm" variant="outline">
                      Enable
                    </Button>
                  </AlertAction>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Uso en código</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                <p className="text-muted-foreground mb-2">// Importar el hook</p>
                <p>import {'{ toast }'} from '@/hooks';</p>
                <br />
                <p className="text-muted-foreground mb-2">// Mostrar notificación</p>
                <p>toast({'{'}</p>
                <p className="ml-4">variant: 'success',</p>
                <p className="ml-4">title: 'Título de la notificación',</p>
                <p className="ml-4">description: 'Descripción del mensaje',</p>
                <p>{'});'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
