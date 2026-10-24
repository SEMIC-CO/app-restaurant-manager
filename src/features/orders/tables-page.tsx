import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CategoryTabs,
  ConfigSidebar,
  AppHeader,
} from '@/components/common';
import { useFloorTables } from '@/hooks';
import { TablesGrid } from '@/components/pos/tables-grid';
import type { Category, FloorTable } from '@/types';

export function TablesPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('all');

  const { tables: allTables, sections, loading } = useFloorTables();

  const categories: Category[] = [
    { id: 'all', name: 'Todas', order: 0 },
    ...sections.map((section, index) => ({
      id: String(section.id),
      name: section.name,
      order: index + 1,
    })),
  ];

  const tables =
    activeSection === 'all'
      ? allTables
      : allTables.filter((table) => String(table.sectionId) === activeSection);

  const handleSelectTable = (table: FloorTable) => {
    navigate('/pedidos/nuevo', { state: { mesa: table } });
  };

  const availableCount = tables.filter((t) => t.floorStatus === 'available').length;
  const occupiedCount = tables.filter((t) => t.floorStatus === 'occupied').length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      {/* Left nav sidebar (lg+) */}
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        <ConfigSidebar />
      </aside>

      {/* Right column: AppHeader + content */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>
        <div className="space-y-6 p-6 overflow-y-auto">
          {/* Header: Título + contadores rápidos */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Mesas</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecciona una mesa para tomar el pedido.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-medium">{availableCount} libres</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="font-medium">{occupiedCount} ocupadas</span>
              </span>
            </div>
          </div>

          {/* Tabs por sección real del backend */}
          <div>
            <CategoryTabs
              categories={categories}
              activeCategory={activeSection}
              onCategoryChange={setActiveSection}
            />
          </div>

          {/* Grid de mesas */}
          <TablesGrid
            tables={tables}
            onSelectTable={handleSelectTable}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
