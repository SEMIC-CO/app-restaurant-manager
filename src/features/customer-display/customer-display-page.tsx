import { useEffect, useState } from 'react';
import { Banknote, CheckCircle2, CreditCard, QrCode } from 'lucide-react';
import { useAuthStore } from '@/store';
import { useCurrentHeadquarter } from '@/hooks';
import {
  announceCustomerDisplayReady,
  productService,
  subscribeCustomerDisplay,
  type CustomerDisplaySnapshot,
} from '@/services';
import { formatCurrency } from '@/utils';
import type { ApiProduct } from '@/types';

/**
 * Segunda pantalla de Caja (`/caja/vista-cliente`): lo que ve el cliente
 * mientras se cobra su pedido.
 *
 * En cuanto Caja carga un pedido o una mesa, publica el snapshot real (ítems,
 * totales y método de pago) por BroadcastChannel y esta pantalla lo pinta.
 * Cuando no hay pedido cargado muestra el catálogo con precios.
 *
 * El QR sigue siendo un placeholder: cuando se configure por sede (Nequi u
 * otras apps) se cargará aquí la imagen correspondiente.
 */
export function CustomerDisplayPage() {
  const headquarter = useCurrentHeadquarter();
  const headquarterId = useAuthStore((state) => state.user?.headquarterId ?? null);
  const [snapshot, setSnapshot] = useState<CustomerDisplaySnapshot | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeCustomerDisplay(headquarterId, (message) => {
      if (message.type === 'snapshot') setSnapshot(message.payload);
    });
    announceCustomerDisplayReady(headquarterId);
    return unsubscribe;
  }, [headquarterId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const items = await productService.listAll({ available: true });
        if (active) setProducts(items);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const hasOrder =
    snapshot !== null && snapshot.phase !== 'idle' && snapshot.items.length > 0;
  const paid = snapshot?.phase === 'paid';
  const method = snapshot?.paymentMethod ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            RestoBar Manager
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Vista Cliente
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {hasOrder
              ? 'Detalle de su pedido y forma de pago'
              : 'Precios de nuestro menú'}
          </p>
        </div>
        {headquarter && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 sm:text-right">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">
              Sede
            </p>
            <p className="text-lg font-semibold">{headquarter.name}</p>
          </div>
        )}
      </header>

      {hasOrder && snapshot ? (
        <main className="grid flex-1 gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <h2 className="text-2xl font-semibold">Su pedido</h2>
              {snapshot.orderNumber && (
                <span className="text-lg text-orange-400">
                  {snapshot.orderNumber}
                </span>
              )}
              {snapshot.table && (
                <span className="text-lg text-slate-300">{snapshot.table}</span>
              )}
            </div>
            {snapshot.customerName && (
              <p className="mb-5 text-base text-slate-400">
                Cliente: {snapshot.customerName}
              </p>
            )}

            <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5 px-6">
              {snapshot.items.map((item, index) => (
                <li
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-semibold text-orange-400">
                      {item.quantity}×
                    </span>
                    <span className="text-lg">{item.name}</span>
                  </div>
                  <span className="shrink-0 text-lg font-semibold tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-lg">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(snapshot.subtotal)}</span>
              </div>
              {snapshot.discount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Descuento</span>
                  <span className="tabular-nums">
                    -{formatCurrency(snapshot.discount)}
                  </span>
                </div>
              )}
              {snapshot.tip > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Propina</span>
                  <span className="tabular-nums">{formatCurrency(snapshot.tip)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
                <span className="text-xl font-semibold">Total a pagar</span>
                <span className="text-3xl font-bold tabular-nums text-orange-400">
                  {formatCurrency(snapshot.total)}
                </span>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            {paid ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-green-500/30 bg-green-500/10 px-6 py-10 text-center">
                <CheckCircle2 className="h-24 w-24 text-green-400" strokeWidth={1.3} />
                <p className="mt-6 text-3xl font-bold">¡Pago confirmado!</p>
                <p className="mt-2 text-lg text-slate-300">Gracias por su compra</p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-6 py-10 text-center">
                {method === 'qr' ? (
                  <>
                    <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-white/5">
                      <QrCode className="h-28 w-28 text-orange-400" strokeWidth={1.2} />
                    </div>
                    <p className="mt-6 text-2xl font-semibold">Pague con QR</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Escanee con su aplicación bancaria
                    </p>
                    {/* TODO: imagen del QR por sede (Nequi u otras apps). */}
                  </>
                ) : method === 'card' ? (
                  <>
                    <CreditCard className="h-28 w-28 text-orange-400" strokeWidth={1.2} />
                    <p className="mt-6 text-2xl font-semibold">Pago con tarjeta</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Presente su tarjeta en caja
                    </p>
                  </>
                ) : method === 'cash' ? (
                  <>
                    <Banknote className="h-28 w-28 text-orange-400" strokeWidth={1.2} />
                    <p className="mt-6 text-2xl font-semibold">Pago en efectivo</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Entregue el efectivo en caja
                    </p>
                  </>
                ) : (
                  <>
                    <QrCode className="h-28 w-28 text-orange-400" strokeWidth={1.2} />
                    <p className="mt-6 text-2xl font-semibold">
                      Seleccione el método de pago en caja
                    </p>
                  </>
                )}
              </div>
            )}
          </aside>
        </main>
      ) : (
        <main className="grid flex-1 gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <h2 className="mb-5 text-2xl font-semibold">Nuestro menú</h2>
            {loading ? (
              <p className="py-16 text-center text-lg text-slate-400">
                Cargando productos…
              </p>
            ) : error ? (
              <p className="py-16 text-center text-lg text-orange-400">
                No se pudo cargar el menú. Intente nuevamente.
              </p>
            ) : products.length === 0 ? (
              <p className="py-16 text-center text-lg text-slate-400">
                No hay productos disponibles en esta sede.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4"
                  >
                    <span className="text-lg font-medium leading-snug">
                      {product.name}
                    </span>
                    <span className="shrink-0 text-xl font-bold tabular-nums text-orange-400">
                      {formatCurrency(Number(product.price))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="flex flex-col gap-5">
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-6 py-10 text-center">
              <QrCode className="h-28 w-28 text-orange-400" strokeWidth={1.2} />
              <p className="mt-6 text-2xl font-semibold">Pague con QR</p>
              <p className="mt-2 text-sm text-slate-400">
                Escanee el código con su aplicación bancaria
              </p>
              {/* TODO: imagen del QR por sede (Nequi u otras apps). */}
            </div>
            <div className="flex items-center justify-center gap-6 rounded-xl border border-white/10 bg-white/5 px-6 py-5 text-slate-400">
              <div className="flex items-center gap-2">
                <Banknote className="h-6 w-6" />
                <span className="text-sm font-medium">Efectivo</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm font-medium">Tarjeta</span>
              </div>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
