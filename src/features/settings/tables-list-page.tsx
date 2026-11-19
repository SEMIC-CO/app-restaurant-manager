import * as React from 'react';
import { ConfigLayout } from '@/app/layout';
import {
  ConfigSidebar,
  SectionFormDialog,
  TableFormDialog,
  type TableFormData,
} from '@/components/common';
import { Card, CardContent, Button, Input, Badge, Switch } from '@/components/ui';
import { sectionService, tableService } from '@/services';
import { toast } from '@/hooks';
import type { ApiResponse, RestaurantTable, Section } from '@/types';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutPanelTop,
} from 'lucide-react';

const TABLES_PAGE_SIZE = 10;

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

export function TablesListPage() {
  const [tables, setTables] = React.useState<RestaurantTable[]>([]);
  const [tablesTotal, setTablesTotal] = React.useState(0);
  const [tablesPage, setTablesPage] = React.useState(1);
  const [tablesTotalPages, setTablesTotalPages] = React.useState(1);
  const [tablesSearch, setTablesSearch] = React.useState('');
  const [tablesLoading, setTablesLoading] = React.useState(true);

  const [sections, setSections] = React.useState<Section[]>([]);
  const [tableCounts, setTableCounts] = React.useState<Record<number, number>>({});

  const [isTableDialogOpen, setIsTableDialogOpen] = React.useState(false);
  const [editingTable, setEditingTable] = React.useState<RestaurantTable | null>(null);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<Section | null>(null);

  const isFirstSearchRender = React.useRef(true);

  const loadTables = React.useCallback(async (page: number, search: string) => {
    setTablesLoading(true);
    try {
      const resp = await tableService.list({
        page,
        limit: TABLES_PAGE_SIZE,
        search: search || undefined,
      });
      if (resp.code === 200) {
        setTables(resp.data.items);
        setTablesTotal(resp.data.total);
        setTablesPage(resp.data.page);
        setTablesTotalPages(resp.data.totalPages);
      } else {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar mesas',
          description: resp.msg || 'No se pudieron cargar las mesas.',
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al cargar mesas',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setTablesLoading(false);
    }
  }, []);

  const loadSections = React.useCallback(async () => {
    try {
      const resp = await sectionService.list({ limit: 100 });
      if (resp.code !== 200) {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar secciones',
          description: resp.msg || 'No se pudieron cargar las secciones.',
        });
        return;
      }
      setSections(resp.data.items);

      const countsResp = await tableService.list({ limit: 100 });
      if (countsResp.code === 200) {
        const counts: Record<number, number> = {};
        for (const table of countsResp.data.items) {
          counts[table.sectionId] = (counts[table.sectionId] ?? 0) + 1;
        }
        setTableCounts(counts);
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al cargar secciones',
        description: 'No se pudo conectar con el servidor.',
      });
    }
  }, []);

  React.useEffect(() => {
    void loadTables(1, '');
    void loadSections();
  }, [loadTables, loadSections]);

  React.useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void loadTables(1, tablesSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [tablesSearch, loadTables]);

  const refreshAll = React.useCallback(
    async (page: number) => {
      await Promise.all([loadTables(page, tablesSearch), loadSections()]);
    },
    [loadTables, loadSections, tablesSearch],
  );

  const handleCreateTable = () => {
    setEditingTable(null);
    setIsTableDialogOpen(true);
  };

  const handleEditTable = (table: RestaurantTable) => {
    setEditingTable(table);
    setIsTableDialogOpen(true);
  };

  const handleSubmitTable = async (data: TableFormData) => {
    const isEdit = Boolean(editingTable);

    // Alta masiva (solo al crear): genera "{base} 1"…"{base} N" con el
    // nombre como base (sin números finales; vacío → "Mesa"), saltando los
    // nombres que ya existan en la sección.
    if (!isEdit && data.quantity > 1) {
      const base =
        data.name.trim().replace(/\s+\d+$/, '') || 'Mesa';
      const existingResp = await tableService.list({
        sectionId: data.sectionId,
        limit: 100,
      });
      const existingNames = new Set(
        existingResp.code === 200
          ? existingResp.data.items.map((table) => table.name)
          : [],
      );

      const names: string[] = [];
      for (let i = 1; names.length < data.quantity && i <= 999; i += 1) {
        const name = `${base} ${i}`;
        if (!existingNames.has(name)) names.push(name);
      }

      let created = 0;
      let failure: string | null = null;
      for (const name of names) {
        try {
          const resp = await tableService.create({
            name,
            cantPeople: data.cantPeople,
            sectionId: data.sectionId,
          });
          if (resp.code === 200 || resp.code === 201) {
            created += 1;
            continue;
          }
          failure = apiErrorMessage(resp, 'Ocurrió un error al crear las mesas.');
          break;
        } catch {
          failure = 'No se pudo conectar con el servidor.';
          break;
        }
      }

      await refreshAll(1);

      if (failure === null) {
        toast({
          variant: 'success',
          title: `✅ ${created} mesas creadas`,
          description: `${names[0]} … ${names[names.length - 1]}`,
        });
        return;
      }
      if (created > 0) {
        // Parcial: se cierra el diálogo (ya hay mesas creadas) y se avisa.
        toast({
          variant: 'warning',
          title: `⚠️ ${created} de ${data.quantity} mesas creadas`,
          description: failure,
        });
        return;
      }
      // Nada creado: se lanza para que el diálogo permanezca abierto.
      toast({
        variant: 'warning',
        title: '❌ Error al crear mesas',
        description: failure,
      });
      throw new Error(failure);
    }

    // Creación simple (una mesa) o edición: mismo flujo de siempre.
    const resp =
      isEdit && editingTable
        ? await tableService.update(editingTable.id, {
            name: data.name,
            cantPeople: data.cantPeople,
            sectionId: data.sectionId,
          })
        : await tableService.create({
            name: data.name.trim(),
            cantPeople: data.cantPeople,
            sectionId: data.sectionId,
          });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Mesa actualizada' : '✅ Mesa creada',
        description: isEdit
          ? 'La mesa se ha actualizado correctamente.'
          : 'La mesa se ha creado correctamente.',
      });
      await refreshAll(isEdit ? tablesPage : 1);
    } else {
      const message = apiErrorMessage(resp, 'Ocurrió un error al guardar la mesa.');
      toast({
        variant: 'warning',
        title: isEdit ? '❌ Error al actualizar mesa' : '❌ Error al crear mesa',
        description: message,
      });
      throw new Error(message);
    }
  };

  const handleDeleteTable = async (table: RestaurantTable) => {
    if (!window.confirm(`¿Seguro que quieres eliminar la mesa "${table.name}"?`)) return;

    const resp = await tableService.remove(table.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Mesa eliminada',
        description: 'La mesa se ha eliminado correctamente.',
      });
      await refreshAll(tablesPage);
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar mesa',
        description: apiErrorMessage(
          resp,
          'No se pudo eliminar la mesa. Puede tener órdenes asociadas.',
        ),
      });
    }
  };

  const handleToggleStatus = async (table: RestaurantTable, active: boolean) => {
    const status = active ? 'ACTIVO' : 'INACTIVO';
    const resp = await tableService.update(table.id, { status });
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: active ? '✅ Mesa activada' : '✅ Mesa desactivada',
        description: `La mesa "${table.name}" ahora está ${active ? 'activa' : 'desactivada'}.`,
      });
      await refreshAll(tablesPage);
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al cambiar el estado',
        description: apiErrorMessage(resp, 'No se pudo cambiar el estado de la mesa.'),
      });
    }
  };

  const handleCreateSection = () => {
    setEditingSection(null);
    setIsSectionDialogOpen(true);
  };
  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setIsSectionDialogOpen(true);
  };

  const handleSubmitSection = async (data: { name: string }) => {
    const isEdit = Boolean(editingSection);
    const resp =
      isEdit && editingSection
        ? await sectionService.update(editingSection.id, data)
        : await sectionService.create(data);

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Sección actualizada' : '✅ Sección creada',
        description: isEdit
          ? 'La sección se ha actualizado correctamente.'
          : 'La sección se ha creado correctamente.',
      });
      await loadSections();
    } else {
      const message = apiErrorMessage(resp, 'Ocurrió un error al guardar la sección.');
      toast({
        variant: 'warning',
        title: isEdit ? '❌ Error al actualizar sección' : '❌ Error al crear sección',
        description: message,
      });
      throw new Error(message);
    }
  };

  const handleDeleteSection = async (section: Section) => {
    if ((tableCounts[section.id] ?? 0) > 0) {
      toast({
        variant: 'warning',
        title: '❌ No se puede eliminar',
        description: 'La sección tiene mesas asignadas. Elimina o mueve las mesas primero.',
      });
      return;
    }

    if (!window.confirm(`¿Seguro que quieres eliminar la sección "${section.name}"?`)) return;

    const resp = await sectionService.remove(section.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Sección eliminada',
        description: 'La sección se ha eliminado correctamente.',
      });
      await loadSections();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar sección',
        description: apiErrorMessage(
          resp,
          'No se pudo eliminar la sección. Puede tener mesas asociadas.',
        ),
      });
    }
  };

  const sectionName = (sectionId: number) =>
    sections.find((section) => section.id === sectionId)?.name ?? '—';

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Mesas</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Administra las mesas y las secciones del restaurante
                </p>
              </div>
              <Button className="gap-2" onClick={handleCreateTable}>
                <Plus className="h-4 w-4" />
                Nueva Mesa
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar mesa..."
                value={tablesSearch}
                onChange={(e) => setTablesSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Mesa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Capacidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Sección
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
                    {tablesLoading && tables.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          Cargando mesas...
                        </td>
                      </tr>
                    ) : tables.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          {tablesSearch
                            ? 'No hay mesas que coincidan con la búsqueda'
                            : 'No hay mesas registradas'}
                        </td>
                      </tr>
                    ) : (
                      tables.map((table) => (
                        <tr key={table.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <span className="font-medium block">{table.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ID: {table.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary">{table.cantPeople} personas</Badge>
                          </td>
                          <td className="px-6 py-4">{sectionName(table.sectionId)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={table.status === 'ACTIVO'}
                                onCheckedChange={(checked: boolean) =>
                                  void handleToggleStatus(table, checked)
                                }
                                aria-label={
                                  table.status === 'ACTIVO'
                                    ? 'Desactivar mesa'
                                    : 'Activar mesa'
                                }
                              />
                              <span
                                className={
                                  table.status === 'ACTIVO'
                                    ? 'text-sm text-green-600 dark:text-green-400'
                                    : 'text-sm text-muted-foreground'
                                }
                              >
                                {table.status === 'ACTIVO' ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTable(table)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => void handleDeleteTable(table)}
                                className="h-8 w-8 hover:text-destructive"
                                title="Eliminar mesa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {tables.length} de {tablesTotal} mesas
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void loadTables(tablesPage - 1, tablesSearch)}
                    disabled={tablesPage <= 1 || tablesLoading}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  {Array.from({ length: tablesTotalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === tablesPage ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => void loadTables(page, tablesSearch)}
                      className="h-8 w-8"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void loadTables(tablesPage + 1, tablesSearch)}
                    disabled={tablesPage >= tablesTotalPages || tablesLoading}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border-b bg-background px-6 py-4 rounded-lg flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <LayoutPanelTop className="h-5 w-5" />
                Secciones
              </h2>
              <p className="text-sm text-muted-foreground">
                Agrupa las mesas por zona del restaurante (Terraza, Salón, etc.)
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={handleCreateSection}>
              <Plus className="h-4 w-4" />
              Nueva Sección
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Sección
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Mesas
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sections.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                          No hay secciones registradas. Crea una para poder agregar mesas.
                        </td>
                      </tr>
                    ) : (
                      sections.map((section) => {
                        const mesaCount = tableCounts[section.id] ?? 0;
                        return (
                          <tr key={section.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4">
                              <span className="font-medium block">{section.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ID: {section.id}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={mesaCount > 0 ? 'secondary' : 'outline'}>
                                {mesaCount} mesas
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSection(section)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => void handleDeleteSection(section)}
                                  className="h-8 w-8 hover:text-destructive"
                                  disabled={mesaCount > 0}
                                  title={
                                    mesaCount > 0
                                      ? 'No se puede eliminar con mesas asignadas'
                                      : 'Eliminar sección'
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <TableFormDialog
            open={isTableDialogOpen}
            onOpenChange={setIsTableDialogOpen}
            table={editingTable ?? undefined}
            sections={sections}
            onSubmit={handleSubmitTable}
          />

          <SectionFormDialog
            open={isSectionDialogOpen}
            onOpenChange={setIsSectionDialogOpen}
            section={editingSection ?? undefined}
            onSubmit={handleSubmitSection}
          />
        </div>
      }
    />
  );
}
