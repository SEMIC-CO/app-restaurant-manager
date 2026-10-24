import { useMemo, useState } from 'react';
import { POSLayout } from '@/app/layout';
import {
  CategoryTabs,
  ConfigSidebar,
  SearchInput,
  AppHeader,
} from '@/components/common';
import {
  Button,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { TableIcon } from 'lucide-react';
import type { OrderType } from '@/types';
import { formatCurrency } from '@/utils';
import { useOrdersStore } from '@/store';
import { useCategories, useProducts } from '@/hooks';

const orderTypeLabels: Record<OrderType, { label: string; className: string }> = {
  'para-llevar': { label: 'Para Llevar', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  mesa: { label: 'Mesa', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  domicilio: { label: 'Domicilio', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
};

export function OrdersPage() {
  const { categories } = useCategories();
const { products } = useProducts('all');

  const { orders, addOrder } = useOrdersStore();

  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | undefined>(undefined);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product: any; quantity: number }>>([]);
  const [selectorSearch, setSelectorSearch] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(selectorSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(selectorSearch.toLowerCase()),
    );
  }, [products, selectorSearch]);

  const handleProductSelect = (product: any, quantity: number = 1) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.product.id === product.id);
      if (existing) {
        return prev.map(p =>
          p.product.id === product.id
            ? { ...p, quantity: p.quantity + quantity }
            : p
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product.id !== productId));
  };

  const handleCreateOrder = async () => {
    if (selectedProducts.length === 0) return;

    const items = selectedProducts.map(p => ({
      productId: p.product.id,
      quantity: p.quantity,
    }));

    try {
      const resp = await (await import('@/services')).orderService.create({
        customerName: customerName || undefined,
        tableNumber: selectedTable?.name || undefined,
        idTable: selectedTable?.id || undefined,
        items,
        orderType: selectedOrderType,
      });

addOrder({
        id: String(resp.data.id),
        orderNumber: resp.data.orderNumber,
        customerName: resp.data.customerName || undefined,
        tableNumber: resp.data.tableNumber ? Number(resp.data.tableNumber) : undefined,
        status: resp.data.status,
        subtotal: resp.data.subtotal,
        tax: 0,
        total: resp.data.total,
        type: selectedOrderType || 'para-llevar',
        items: resp.data.items.map((item: any) => ({
          id: item.id?.toString() || crypto.randomUUID(),
          productId: item.productId?.toString() || '',
          productName: item.productName || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          subtotal: item.subtotal || 0,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setIsCreateOrderOpen(false);
      setSelectedOrderType(undefined);
      setSelectedTable(null);
      setCustomerName('');
      setSelectedProducts([]);
    } catch (error: any) {
      console.error('Error creating order:', error);
    }
  };

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
                  activeCategory="all"
                  onCategoryChange={() => {}}
                />
                <div className="w-full sm:w-72 flex-shrink-0">
                  <SearchInput
                    value={selectorSearch}
                    onChange={(value) => setSelectorSearch(value)}
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden rounded-lg border bg-card">
                {orders.length > 0 ? (
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Mis Órdenes</h3>
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 border rounded-lg bg-card transition-shadow hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-primary">
                                #{order.orderNumber.replace('ORD-', '')}
                              </span>
                              {order.type && (
                                <Badge
                                  variant="outline"
                                  className="px-2 py-1 text-[10px] uppercase font-medium"
                                >
                                  {orderTypeLabels[order.type].label}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {order.customerName || 'Sin cliente'}
                              </div>
                              <div className="text-lg font-bold text-primary">
                                {formatCurrency(order.total)}
                              </div>
                            </div>
                          </div>
                          {order.tableNumber && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Mesa: {order.tableNumber}
                            </p>
                          )}
                          {order.items.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {order.items.length} items
                            </p>
                          )}
                          {order.status && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-[10px] px-2 py-0.5"
                            >
                              {order.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No hay órdenes aún
                  </div>
                )}
              </div>
            </div>
          }
          sidebar={
            <div className="h-full flex-col overflow-y-auto p-4 bg-card">
              <Button
                onClick={() => setIsCreateOrderOpen(true)}
                className="w-full mb-4 bg-primary hover:bg-primary/90"
              >
                Crear Nueva Orden
              </Button>
            </div>
          }
        />

        {isCreateOrderOpen && (
          <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
            <DialogContent className="sm:max-w-2xl w-full max-w-[560px]">
              <DialogHeader className="p-4 pb-3">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <TableIcon className="h-5 w-5 text-primary" />
                  <span>Crear Nueva Orden</span>
                </DialogTitle>
                <DialogDescription>
                  Selecciona el tipo de orden, mesa y productos
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateOrder();
              }} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      Tipo de Orden
                    </Label>
                    <Select
                      onValueChange={(value: string) => {
                        setSelectedOrderType(value as OrderType);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="para-llevar">
                          Para Llevar
                        </SelectItem>
                        <SelectItem value="mesa">
                          Mesa
                        </SelectItem>
                        <SelectItem value="domicilio">
                          Domicilio
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      Cliente (Opcional)
                    </Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Productos
                  </Label>
                  <ScrollArea className="h-[200px] p-1 bg-card rounded border" >
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-2 border-b border-muted/20 last:border-0 last:mb-1 flex items-center gap-2"
                      >
                        <span className="text-sm font-medium">
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ${product.price}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleProductSelect(product, 1)}
                        >
                          +
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mt-2 p-2 bg-muted/30 rounded">
                    <p className="text-sm font-medium">Seleccionados: {selectedProducts.length}</p>
                    {selectedProducts.map((sp, idx) => (
                      <div key={idx} className="text-xs mt-1">
                        {sp.product.name}: {sp.quantity}{' '}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => handleRemoveProduct(sp.product.id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={selectedProducts.length === 0}
                    className="bg-primary hover:bg-primary/90 w-full"
                  >
                    Guardar Orden
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOrderOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}