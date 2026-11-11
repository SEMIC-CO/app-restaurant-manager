import * as React from 'react';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import {
  InventoryCategoriesPanel,
  InventoryItemsPanel,
  InventoryMovementsPanel,
} from '@/components/inventory';
import { cn } from '@/lib/utils';

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
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">Inventario</h1>
              <p className="text-muted-foreground">
                Administra los artículos, sus categorías y los movimientos de
                stock de tu sede
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-muted-foreground/30',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'items' && <InventoryItemsPanel />}
          {activeTab === 'categories' && <InventoryCategoriesPanel />}
          {activeTab === 'movements' && <InventoryMovementsPanel />}
        </div>
      }
    />
  );
}
