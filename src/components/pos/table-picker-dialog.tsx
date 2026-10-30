import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { CategoryTabs } from '@/components/common';
import { TablesGrid } from './tables-grid';
import type { Category, FloorTable, Section } from '@/types';

interface TablePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mesas de la sede (con ocupación derivada); aquí se filtran las LIBRES. */
  tables: FloorTable[];
  /** Secciones reales para el filtro (igual que la vista de Mesas). */
  sections: Section[];
  loading?: boolean;
  onSelectTable: (table: FloorTable) => void;
}

/**
 * Popup para elegir mesa en el pedido: muestra **solo las mesas libres** con
 * las mismas cards de la vista de Mesas pero en tamaño compacto (`size="sm"`)
 * y conservando el filtro por secciones.
 */
export function TablePickerDialog({
  open,
  onOpenChange,
  tables,
  sections,
  loading = false,
  onSelectTable,
}: TablePickerDialogProps) {
  const [activeSection, setActiveSection] = useState('all');

  const categories: Category[] = useMemo(
    () => [
      { id: 'all', name: 'Todas', order: 0 },
      ...sections.map((section, index) => ({
        id: String(section.id),
        name: section.name,
        order: index + 1,
      })),
    ],
    [sections],
  );

  const freeTables = useMemo(
    () => tables.filter((table) => table.floorStatus === 'available'),
    [tables],
  );
  const visibleTables =
    activeSection === 'all'
      ? freeTables
      : freeTables.filter((table) => String(table.sectionId) === activeSection);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Seleccionar mesa libre</DialogTitle>
          <DialogDescription>
            Solo aparecen las mesas disponibles de tu sede. Usa las secciones
            para filtrar.
          </DialogDescription>
        </DialogHeader>

        {/* Mismo filtro de secciones que la vista de Mesas */}
        <CategoryTabs
          categories={categories}
          activeCategory={activeSection}
          onCategoryChange={setActiveSection}
        />

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <TablesGrid
            size="sm"
            tables={visibleTables}
            loading={loading}
            onSelectTable={onSelectTable}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
