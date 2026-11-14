import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import {
  ActiveOrdersPanel,
  AlertsPanel,
  DashboardHeader,
  DashboardKpiCards,
  RecentOrdersTable,
  TopProductsPanel,
} from '@/components/dashboard';
import { Button, Card, Skeleton } from '@/components/ui';
import { useDashboard } from '@/hooks';
import { useNavigationStore } from '@/store';
import { canAccessPath } from '@/utils';

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-lg border-b bg-background px-6 py-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-36 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-lg lg:col-span-1" />
        <Skeleton className="h-64 rounded-lg lg:col-span-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      <Card className="p-10 text-center">
        <h2 className="text-lg font-semibold">
          No se pudo cargar el dashboard
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button className="mt-4" onClick={onRetry}>
          Reintentar
        </Button>
      </Card>
    </div>
  );
}

/**
 * Dashboard (`/`): lo que está pasando hoy en el restaurante — KPIs con
 * comparativa contra ayer, salón en vivo, alertas, ranking de productos y
 * últimos movimientos.
 *
 * Los datos vienen de `GET /reports/dashboard` (ver `useDashboard`), que se
 * refresca con los eventos de pedidos de la sede.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { report, loading, refreshing, error, refresh } = useDashboard();
  const menus = useNavigationStore((state) => state.menus);

  // "Ver detalles" del ranking solo si el perfil puede abrir Reportes.
  const canSeeReports = canAccessPath(
    '/reportes',
    menus.map((menu) => menu.path),
  );

  const main =
    loading && !report ? (
      <DashboardSkeleton />
    ) : !report ? (
      <DashboardError
        message={error ?? 'No se pudieron cargar los datos del dashboard.'}
        onRetry={refresh}
      />
    ) : (
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardHeader
          date={report.date}
          refreshing={refreshing}
          onRefresh={refresh}
        />

        <DashboardKpiCards kpi={report.kpi} />

        <div className="grid gap-6 lg:grid-cols-3">
          <ActiveOrdersPanel
            activeOrders={report.activeOrders}
            tables={report.tables}
            className="lg:col-span-1"
          />
          <AlertsPanel alerts={report.alerts} className="lg:col-span-2" />
        </div>

        <TopProductsPanel
          products={report.products}
          categoryMix={report.categoryMix}
          onViewDetails={canSeeReports ? () => navigate('/reportes') : undefined}
        />

        <RecentOrdersTable orders={report.recentOrders} />
      </div>
    );

  return <ConfigLayout sidebar={<ConfigSidebar />} main={main} />;
}
