import * as React from 'react';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar, FilterTabs } from '@/components/common';
import {
  InventoryCategoriesPanel,
  InventoryItemsPanel,
  InventoryMovementsPanel,
} from '@/components/inventory';

const TABS = [
  { id: 'items', label: 'Artículos' },
  { id: 'categories', label: 'Categorías' },
  { id: 'movements', label: 'Movimientos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * Módulo de Inventario (grupo PRINCIPAL del sidebar): una sola ruta
 * `/inventario` con tres pestañas — Artículos (con stock por sede),
 * Categorías y Movimientos (kardex).
 */
export function InventoryPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>('items');

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Encabezado al estilo de Mesas/Pedidos: título + descripción */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Administra los artículos, sus categorías y los movimientos de
              stock de tu sede
            </p>
          </div>

          {/* Filtros después del encabezado (igual que en Mesas/Pedidos) */}
          <FilterTabs
            label="Filtrar vista de inventario"
            items={TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
            active={activeTab}
            onChange={(id) => setActiveTab(id as TabId)}
            className="flex-nowrap overflow-x-auto pb-1"
          />

          {activeTab === 'items' && <InventoryItemsPanel />}
          {activeTab === 'categories' && <InventoryCategoriesPanel />}
          {activeTab === 'movements' && <InventoryMovementsPanel />}
        </div>
      }
    />
  );
}
