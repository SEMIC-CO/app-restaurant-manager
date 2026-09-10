import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { POSLayout } from '@/app/layout';
import {
  CategoryTabs,
  ConfigSidebar,
  SearchInput,
  AppHeader,
} from '@/components/common';
import { ProductGrid, OrderTicket } from '@/components/pos';
import { useProducts, useCategories, useTables } from '@/hooks';
import { useCartStore } from '@/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Users, Table as TableIcon, Filter, BedDouble as BedDoubleIcon } from 'lucide-react';
import type { Product, Table, Category, TableStatus } from '@/types';

const statusStyles: Record<TableStatus, { dot: string; badge: string; label: string }> = {
  available: { dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', label: 'Libre' },
  occupied: { dot: 'bg-red-500', badge: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30', label: 'Ocupada' },
  reserved: { dot: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', label: 'Reservada' },
};

export function OrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [table, setTable] = useState<Table | null>(null);
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');

  const { categories } = useCategories('productos');
  const { products, loading } = useProducts(activeCategory);
  const { tables: allTables, loading: tablesLoading } = useTables('all');
  const { categories: tableCategories } = useCategories('mesas');

  const addItem = useCartStore((state) => state.addItem);
  const setTableInStore = useCartStore((state) => state.setTable);
  const clearTable = useCartStore((state) => state.setTable);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    tableCategories.forEach((c: Category) => { map[c.id] = c.name; });
    return map;
  }, [tableCategories]);

  const filteredTables = useMemo(() => {
    if (!selectorSearch.trim()) return allTables;
    const q = selectorSearch.toLowerCase();
    return allTables.filter((t) =>
      String(t.number).includes(q) ||
      (t.name ?? '').toLowerCase().includes(q) ||
      (categoryNameMap[t.categoryId] ?? '').toLowerCase().includes(q)
    );
  }, [allTables, selectorSearch, categoryNameMap]);

  const groupedTables = useMemo(() => {
    const groups: Record<string, Table[]> = {};
    filteredTables.forEach((t) => {
      if (!groups[t.categoryId]) groups[t.categoryId] = [];
      groups[t.categoryId].push(t);
    });
    return groups;
  }, [filteredTables]);

  const handleChooseTable = (nuevaMesa: Table) => {
    setTable(nuevaMesa);
    setTableInStore(nuevaMesa);
    setIsTableSelectorOpen(false);
    setSelectorSearch('');
  };

  // Lee la mesa enviada desde TablesPage a través del state de React Router
  useEffect(() => {
    const incoming = (location.state as { mesa?: Table } | null)?.mesa;
    if (incoming) {
      setTable(incoming);
      setTableInStore(incoming);
    } else {
      // si llegamos sin state, usamos la que ya esté guardada en el store
      setTable(useCartStore.getState().table);
    }
  }, [location.state, setTableInStore]);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
    });
  };

  const handleCharge = () => navigate('/checkout');
  const handleSave = () => console.log('Saving order...', { table });
  const handleClearTable = () => {
    clearTable(null);
    setTable(null);
  };

  const filteredProducts = searchQuery
    ? products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : products;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        <ConfigSidebar />
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>
        <POSLayout
          main={
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CategoryTabs
                  categories={categories}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
                <div className="w-full sm:w-72 flex-shrink-0">
                  <SearchInput value={searchQuery} onChange={setSearchQuery} />
                </div>
              </div>

              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
                loading={loading}
              />
            </div>
          }
          sidebar={
            <div className="flex h-full flex-col gap-3 min-h-0">
              <Dialog open={isTableSelectorOpen} onOpenChange={setIsTableSelectorOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant={table ? 'outline' : 'default'}
                    className={[
                      'w-full gap-2 justify-center',
                      table && 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                    ].join(' ')}
                  >
                    <TableIcon className="h-4 w-4" />
                    {table ? (
                      <>
                        Cambiar · {table.name ?? `Mesa ${table.number}`}
                        <span className={`inline-block h-2 w-2 rounded-full ${statusStyles[table.status].dot}`} />
                      </>
                    ) : (
                      'Asignar Mesa al Pedido'
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[560px] w-[calc(100%-2rem)] max-h-[85vh] flex flex-col p-0 gap-0">
                  <DialogHeader className="p-5 pb-3">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <TableIcon className="h-5 w-5 text-primary" />
                      Seleccionar Mesa
                    </DialogTitle>
                    <DialogDescription>
                      Elige la mesa para asociar el pedido. Puedes buscar o filtrar por categoría.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="px-5 pb-2">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={selectorSearch}
                        onChange={(e) => setSelectorSearch(e.target.value)}
                        placeholder="Buscar por número, nombre o zona..."
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <ScrollArea className="flex-1 px-5 pb-5 min-h-[300px] max-h-[50vh]">
                    {tablesLoading ? (
                      <div className="py-16 text-center text-muted-foreground text-sm">
                        Cargando mesas...
                      </div>
                    ) : Object.keys(groupedTables).length === 0 ? (
                      <div className="py-16 text-center text-muted-foreground text-sm">
                        No se encontraron mesas con la búsqueda <span className="font-medium">{selectorSearch}</span>
                      </div>
                    ) : (
                      <div className="space-y-5 pt-2">
                        {Object.entries(groupedTables).map(([catId, mesas]) => (
                          <div key={catId}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {categoryNameMap[catId] ?? catId}
                                <span className="text-xs font-normal text-muted-foreground">
                                  ({mesas.length})
                                </span>
                              </h4>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {mesas.map((t) => {
                                const isCurrent = table?.id === t.id;
                                const style = statusStyles[t.status];
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleChooseTable(t)}
                                    className={[
                                      'group relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                                      'hover:border-primary/50 hover:shadow-sm hover:-translate-y-0.5',
                                      isCurrent
                                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                                        : 'border-border bg-card'
                                    ].join(' ')}
                                  >
                                    <div className="flex items-start justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        {t.icon ? (
                                          <span className="text-lg leading-none">{t.icon}</span>
                                        ) : (
                                          <div className="h-6 w-6 rounded bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                                            <BedDoubleIcon className="h-4 w-4" strokeWidth={2} />
                                          </div>
                                        )}
                                        <span className="font-semibold text-sm">
                                          {t.name ?? `Mesa ${t.number}`}
                                        </span>
                                      </div>
                                      <span className={`h-2.5 w-2.5 rounded-full ${style.dot} ring-2 ring-white dark:ring-background`} />
                                    </div>
                                    <div className="flex items-center justify-between w-full gap-2">
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users className="h-3 w-3" />
                                        {t.capacity} pers.
                                      </div>
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 border ${style.badge}`}>
                                        {style.label}
                                      </Badge>
                                    </div>
                                    {t.customerName && (
                                      <p className="text-[10px] text-muted-foreground truncate w-full">
                                        {t.customerName}
                                      </p>
                                    )}
                                    {isCurrent && (
                                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                                        Actual
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {table && (
                    <div className="flex items-center justify-between border-t p-4 bg-muted/40 rounded-b-lg">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Asignada:</span>{' '}
                        <span className="font-medium">
                          {table.name ?? `Mesa ${table.number}`}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleClearTable}>
                        Quitar asignación
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <div className="flex-1 min-h-0 overflow-hidden rounded-lg border bg-card">
                <OrderTicket
                  orderNumber="#ORD-3942"
                  table={table}
                  tableNumber={table?.number}
                  onCharge={handleCharge}
                  onSave={handleSave}
                  onClearTable={table ? handleClearTable : undefined}
                />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
