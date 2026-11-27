import * as React from 'react';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar, FilterTabs } from '@/components/common';
import {
  InventoryCategoriesPanel,
  InventoryItemsPanel,
  InventoryMovementsPanel,
  MeasurementUnitsPanel,
} from '@/components/inventory';

const TABS = [
  { id: 'items', label: 'Artículos' },
  { id: 'categories', label: 'Categorías' },
  { id: 'movements', label: 'Movimientos' },
  { id: 'units', label: 'Unidades de medida' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * Módulo de Inventario (grupo PRINCIPAL del sidebar): una sola ruta
 * `/inventario` con cuatro pestañas — Artículos (con stock por sede),
 * Categorías, Movimientos (kardex) y el catálogo global de unidades.
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
              Administra los artículos, sus categorías, unidades de medida y
              los movimientos de stock de tu sede
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
          {activeTab === 'units' && <MeasurementUnitsPanel />}
        </div>
      }
    />
  );
}
