import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { POSLayout } from '@/app/layout';
import {
  AppHeader,
  CategoryTabs,
  ConfigSidebar,
  SearchInput,
  SideDrawer,
} from '@/components/common';
import { Button } from '@/components/ui';
import { CartFab, OrderCreateSidebar, ProductGrid } from '@/components/pos';
import {
  toast,
  useCategories,
  useFloorTables,
  useMediaQuery,
  useProducts,
} from '@/hooks';
import { orderService, productService } from '@/services';
import { useOrdersStore } from '@/store';
import { mapApiOrder, orderTypeFromApi, resolveStorageUrl } from '@/utils';
import type {
  ApiOrder,
  ApiResponse,
  FloorTable,
  OrderItem,
  OrderType,
  Product,
} from '@/types';

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

/**
 * Pedidos: creación (por defecto) y **edición** (`/pedidos/:orderId/editar`
 * — misma vista con la info, productos y notas precargados).
 */
export function OrderCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  const isEditing = Boolean(orderId);

  // Productos por categoría (mismo flujo que Caja)
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { categories } = useCategories();
  const { products, loading } = useProducts(activeCategory);

  // Mesas de la sede + órdenes activas (ocupada/libre)
  const { tables, sections, loading: tablesLoading, refresh: refreshTables } =
    useFloorTables();

  // Pedidos creados en esta sesión (la lista de Pedidos los muestra)
  const addOrder = useOrdersStore((state) => state.addOrder);

  // Formulario del nuevo pedido
  // Tipo de pedido: Mesa por defecto (coincide con el default de la BD)
  const [orderType, setOrderType] = useState<OrderType>('mesa');
  const [customerName, setCustomerName] = useState('');
  // Entrega a domicilio (solo se envían con orderType === 'domicilio')
  const [address, setAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  // Notas libres del pedido (columna `orders.notes`)
  const [notes, setNotes] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [creating, setCreating] = useState(false);
  // Modo edición: pedido original del backend
  const [editingApi, setEditingApi] = useState<ApiOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(isEditing);

  // En pantallas < lg el panel lateral no existe (POSLayout lo oculta con
  // `hidden lg:block`): el carrito/formulario se abre como drawer desde el FAB.
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [cartOpen, setCartOpen] = useState(false);

  // Si la ventana crece a escritorio, el drawer deja de tener sentido
  // (vuelve el panel fijo): se cierra para no dejarlo abierto por detrás.
  useEffect(() => {
    if (isDesktop && cartOpen) setCartOpen(false);
  }, [isDesktop, cartOpen]);

  // La mesa llega desde /mesas (TablesPage navega con state.mesa)
  useEffect(() => {
    const incoming = (location.state as { mesa?: FloorTable } | null)?.mesa;
    if (incoming) {
      setSelectedTableId(incoming.id);
      setOrderType('mesa');
    }
  }, [location.state]);

  // Modo edición: carga el pedido y precarga este mismo formulario
  useEffect(() => {
    if (!orderId) return;
    const id = Number(orderId);
    if (!Number.isInteger(id)) {
      toast({
        variant: 'warning',
        title: '❌ Pedido no encontrado',
        description: 'El identificador del pedido no es válido.',
      });
      navigate('/pedidos');
      return;
    }

    let active = true;
    setLoadingOrder(true);

    void (async () => {
      try {
        const [orderResp, productList] = await Promise.all([
          orderService.getById(id),
          productService.listAll(),
        ]);
        if (!active) return;

        if (orderResp.code !== 200 || !orderResp.data) {
          toast({
            variant: 'warning',
            title: '❌ Pedido no encontrado',
            description: apiErrorMessage(orderResp, 'No se pudo cargar el pedido.'),
          });
          navigate('/pedidos');
          return;
        }

        const api = orderResp.data;
        if (
          api.status === 'delivered' ||
          api.status === 'paid' ||
          api.status === 'cancelled'
        ) {
          toast({
            variant: 'warning',
            title: '❌ Pedido finalizado',
            description: 'Solo se pueden editar pedidos en curso.',
          });
          navigate('/pedidos');
          return;
        }

        const nameByProduct = new Map(
          productList.map((product) => [product.id, product.name]),
        );
        const imageByProduct = new Map(
          productList.map((product) => [
            String(product.id),
            resolveStorageUrl(product.imageUrl) ?? undefined,
          ]),
        );
        const mapped = mapApiOrder(api, nameByProduct);

        setEditingApi(api);
        setOrderType(orderTypeFromApi(api));
        setCustomerName(api.customerName ?? '');
        setAddress(api.address ?? '');
        setCustomerPhone(api.customerPhone ?? '');
        setNotes(api.notes ?? '');
        setSelectedTableId(api.idTable);
        setItems(
          mapped.items.map((item) => ({
            ...item,
            productImage: imageByProduct.get(item.productId),
          })),
        );
      } catch {
        if (active) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar el pedido',
            description: 'No se pudo conectar con el servidor.',
          });
          navigate('/pedidos');
        }
      } finally {
        if (active) setLoadingOrder(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loadingOrder) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-muted/30">
        <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
          <ConfigSidebar />
        </aside>
        <div className="flex flex-1 flex-col min-w-0">
          <AppHeader />
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Cargando pedido…
          </div>
        </div>
      </div>
    );
  }

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;

  const filteredProducts = searchQuery
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  // Carrito: agregar producto (sumar cantidad si ya existe)
  const handleAddToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const quantity = existing.quantity + 1;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity, subtotal: item.unitPrice * quantity }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ];
    });

    // Feedback visible: el producto entró al pedido (el badge del FAB del
    // carrito incrementa solo, con su animación de "pop"). El toast usa la
    // duración por defecto (2 s): se muestra y se oculta enseguida para no
    // tapar la carta.
    const unitsInCart =
      items.reduce((sum, item) => sum + item.quantity, 0) + 1;
    toast({
      variant: 'success',
      title: '✅ Producto agregado al pedido',
      description: `“${product.name}” se agregó al pedido · ${unitsInCart} ${
        unitsInCart === 1 ? 'producto' : 'productos'
      } en el carrito.`,
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== itemId) return [item];
        if (quantity <= 0) return [];
        return [{ ...item, quantity, subtotal: item.unitPrice * quantity }];
      }),
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCreateOrder = async () => {
    if (creating || items.length === 0) return;

    if (orderType === 'mesa' && !selectedTable) {
      toast({
        variant: 'warning',
        title: '🪑 Selecciona una mesa',
        description: tablesLoading
          ? 'Espera a que carguen las mesas de la sede.'
          : 'Los pedidos de tipo Mesa requieren una mesa asignada.',
      });
      return;
    }

    setCreating(true);
    try {
      // ===== MODO EDICIÓN: actualiza la información y sustituye los ítems =====
      if (isEditing && editingApi) {
        const infoResp = await orderService.update(editingApi.id, {
          customerName: customerName.trim() || undefined,
          // La mesa solo aplica a tipo Mesa; el resto limpia ("" / null)
          tableNumber: orderType === 'mesa' ? (selectedTable?.name ?? '') : '',
          idTable: orderType === 'mesa' ? (selectedTable?.id ?? null) : null,
          orderType,
          notes: notes.trim() || undefined,
          ...(orderType === 'domicilio'
            ? { address: address.trim(), customerPhone: customerPhone.trim() }
            : { address: '', customerPhone: '' }),
        });
        if (infoResp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ No se pudo actualizar',
            description: apiErrorMessage(infoResp, 'Revisa los datos e inténtalo de nuevo.'),
          });
          return;
        }

        const itemsResp = await orderService.updateItems(
          editingApi.id,
          items.map((item) => ({
            productId: Number(item.productId),
            quantity: item.quantity,
          })),
        );
        if (itemsResp.code !== 200 && itemsResp.code !== 201) {
          toast({
            variant: 'warning',
            title: '❌ No se pudieron actualizar los productos',
            description: apiErrorMessage(
              itemsResp,
              'La información se guardó, pero los productos no se actualizaron.',
            ),
          });
          return;
        }

        toast({
          variant: 'success',
          title: '✅ Pedido actualizado',
          description: `El pedido ${editingApi.orderNumber} se actualizó correctamente.`,
        });
        void refreshTables();
        navigate('/pedidos');
        return;
      }

      // ===== MODO CREACIÓN =====
      const resp = await orderService.create({
        customerName: customerName.trim() || undefined,
        // La mesa solo aplica a pedidos de tipo Mesa
        tableNumber: orderType === 'mesa' ? selectedTable?.name : undefined,
        idTable: orderType === 'mesa' ? selectedTable?.id : undefined,
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
        })),
        orderType,
        notes: notes.trim() || undefined,
        // Dirección/teléfono solo viajan en domicilio; vacíos → null en BD
        ...(orderType === 'domicilio'
          ? { address: address.trim(), customerPhone: customerPhone.trim() }
          : {}),
      });

      if (resp.code === 200 || resp.code === 201) {
        const nameByProduct = new Map(
          items.map((item) => [Number(item.productId), item.productName]),
        );
        addOrder(mapApiOrder(resp.data, nameByProduct));

        toast({
          variant: 'success',
          title: '✅ Pedido creado',
          description: `El pedido ${resp.data.orderNumber} fue registrado correctamente.`,
        });

        void refreshTables();
        // Volver a la lista de pedidos con el pedido recién creado seleccionado
        navigate('/pedidos', { state: { selectedOrderId: String(resp.data.id) } });
      } else {
        const detail = Array.isArray(resp.data)
          ? resp.data.join(' · ')
          : resp.msg || 'Revisa los datos e inténtalo de nuevo.';
        toast({
          variant: 'warning',
          title: '❌ No se pudo crear el pedido',
          description: detail,
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo crear el pedido',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setCreating(false);
    }
  };

  // Cancelar el pedido desde la propia vista de edición
  const handleCancelOrder = async () => {
    if (!editingApi || creating) return;
    if (
      !window.confirm(
        `¿Seguro que quieres cancelar el pedido ${editingApi.orderNumber}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setCreating(true);
    try {
      const resp = await orderService.update(editingApi.id, {
        status: 'cancelled',
      });
      if (resp.code === 200) {
        toast({
          variant: 'success',
          title: '✅ Pedido cancelado',
          description: `El pedido ${editingApi.orderNumber} quedó cancelado.`,
        });
        void refreshTables();
        navigate('/pedidos');
      } else {
        toast({
          variant: 'warning',
          title: '❌ No se pudo cancelar',
          description: apiErrorMessage(resp, 'Intenta de nuevo.'),
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo cancelar',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setCreating(false);
    }
  };

  // Panel lateral del pedido: el MISMO nodo se usa en el panel fijo de
  // escritorio (POSLayout) y dentro del drawer en pantallas chicas. Todo su
  // estado lo controla esta página, así que no hay conflictos al duplicarlo.
  const orderSidebar = (
    <OrderCreateSidebar
      title={isEditing ? 'Editar Pedido' : undefined}
      // En el drawer el título lo pone la cabecera del drawer; en el panel
      // fijo de escritorio el título sigue siendo el de este componente.
      hideHeader={!isDesktop}
      submitLabel={isEditing ? 'Guardar Cambios' : undefined}
      onCancelOrder={isEditing ? handleCancelOrder : undefined}
      cancelling={creating}
      orderType={orderType}
      onOrderTypeChange={setOrderType}
      customerName={customerName}
      onCustomerNameChange={setCustomerName}
      address={address}
      onAddressChange={setAddress}
      customerPhone={customerPhone}
      onCustomerPhoneChange={setCustomerPhone}
      notes={notes}
      onNotesChange={setNotes}
      selectedTableId={selectedTableId}
      onTableChange={setSelectedTableId}
      tables={tables}
      sections={sections}
      tablesLoading={tablesLoading}
      items={items}
      onUpdateQuantity={handleUpdateQuantity}
      onRemoveItem={handleRemoveItem}
      onSubmit={handleCreateOrder}
      submitting={creating}
    />
  );

  // Unidades del carrito: lo que muestra el badge del FAB
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
          wide
          main={
            <div className="space-y-6 pb-24 lg:pb-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate('/pedidos')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a pedidos
                  </Button>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {isEditing ? 'Editar Pedido' : 'Nuevo Pedido'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isEditing
                        ? 'Actualiza la información, los productos o las notas'
                        : 'Selecciona los productos de la carta'}
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-72 flex-shrink-0">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar producto..."
                  />
                </div>
              </div>

              <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
                loading={loading}
                dense
              />
            </div>
          }
          sidebar={isDesktop ? orderSidebar : null}
        />

        {/* FAB del carrito (solo < lg): abre el formulario/pedido en drawer.
            Ícono de LISTADO (igual que la cabecera del drawer): lo que abre
            es la lista de productos agregados. */}
        <CartFab
          count={cartCount}
          onClick={() => setCartOpen(true)}
          label="Ver pedido"
          icon={<ClipboardList className="h-6 w-6" strokeWidth={2.25} />}
        />

        {/* Drawer derecho con el mismo panel del pedido (móvil/tablet).
            Su cabecera lleva el ícono de listado + el título + ✕; el panel
            interno no repite el título (hideHeader). */}
        <SideDrawer
          open={cartOpen}
          onOpenChange={setCartOpen}
          title={isEditing ? 'Editar Pedido' : 'Nuevo Pedido'}
          icon={<ClipboardList className="h-4 w-4 text-primary" />}
        >
          {!isDesktop && orderSidebar}
        </SideDrawer>
      </div>
    </div>
  );
}
