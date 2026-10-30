import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Mail, Printer } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  MoneyInput,
} from '@/components/ui';
import { toast } from '@/hooks';
import { invoiceService, orderService } from '@/services';
import { useCartStore } from '@/store';
import { formatCurrency } from '@/utils';
import type {
  ApiResponse,
  InvoicePaymentMethod,
  OrderStatus,
  PaymentMethod,
} from '@/types';

/** Datos del cliente para la factura: todos opcionales. */
const chargeSchema = z.object({
  name: z.string().max(80, 'Máximo 80 caracteres').optional(),
  identification: z.string().max(40, 'Máximo 40 caracteres').optional(),
  email: z.string().email('Correo electrónico inválido').or(z.literal('')).optional(),
});

type ChargeFormData = z.infer<typeof chargeSchema>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El front usa cash/card/qr; `invoices.payment_method` solo admite estos tres. */
const PAYMENT_METHOD_BY_CART: Record<PaymentMethod, InvoicePaymentMethod> = {
  cash: 'Cash',
  card: 'Card',
  qr: 'Transfer',
};

/**
 * Saltos mínimos para dejar el pedido como **pagado** según la matriz de
 * transiciones del backend (pending → preparing → ready → paid).
 */
const STATUS_PATH_TO_PAID: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'ready', 'paid'],
  preparing: ['ready', 'paid'],
  ready: ['paid'],
  delivered: ['paid'],
  paid: [],
  cancelled: [],
};

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string): string {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

interface ChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Número del pedido cargado en el ticket (si lo hay). */
  orderNumber?: string;
  /** Id numérico del pedido: la factura se genera contra este pedido. */
  orderId?: number;
  /** Estado actual del pedido (para decidir los saltos hasta `paid`). */
  orderStatus?: OrderStatus;
  /** Se dispara al guardar la factura (la caja limpia el ticket). */
  onSaved?: () => void;
}

/**
 * Formulario de cobro de la caja: datos opcionales del cliente, resumen
 * (subtotal, propina, total facturable y total a pagar), efectivo recibido
 * con el cambio a devolver y las acciones de la operación: Imprimir,
 * Enviar email y Guardar factura.
 *
 * "Guardar factura" crea la factura real (`POST /invoices`) y deja el pedido
 * como `paid` (`PUT /orders/:id`), con lo que la mesa queda disponible.
 */
export function ChargeDialog({
  open,
  onOpenChange,
  orderNumber,
  orderId,
  orderStatus,
  onSaved,
}: ChargeDialogProps) {
  const [saving, setSaving] = React.useState(false);
  const {
    getSubtotal,
    getTip,
    getDiscount,
    getTotal,
    getPayable,
    paymentMethod,
    tipRate,
    amountReceived,
    setAmountReceived,
  } = useCartStore();

  const subtotal = getSubtotal();
  const tip = getTip();
  const discount = getDiscount();
  /** Total facturable: sin propina (la propina voluntaria no se factura). */
  const total = getTotal();
  /** Total a cobrar: incluye la propina. */
  const payable = getPayable();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    reset,
  } = useForm<ChargeFormData>({
    resolver: zodResolver(chargeSchema),
    defaultValues: { name: '', identification: '', email: '' },
  });

  // Al cerrar el diálogo se olvidan los datos del cliente de la operación.
  React.useEffect(() => {
    if (!open) reset({ name: '', identification: '', email: '' });
  }, [open, reset]);

  const receivedValue = Number.parseFloat(amountReceived) || 0;
  const hasReceived = amountReceived.trim() !== '';
  /** El cambio se calcula sobre lo que realmente se cobra (con propina). */
  const change = receivedValue - payable;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    const email = (getValues('email') ?? '').trim();
    if (!email) {
      toast({
        variant: 'warning',
        title: '📧 Falta el correo',
        description: 'Escribe el email del cliente para enviarle la factura.',
      });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      toast({
        variant: 'warning',
        title: '📧 Correo inválido',
        description: 'Revisa el email del cliente e inténtalo de nuevo.',
      });
      return;
    }
    toast({
      variant: 'success',
      title: '📧 Factura enviada',
      description: `Se envió la factura a ${email}.`,
    });
  };

  /**
   * Guarda la factura real en el backend (`POST /invoices`) y deja el pedido
   * como `paid` saltando por la matriz de transiciones si hace falta; al
   * salir de los estados activos la mesa queda disponible.
   */
  const handleSave = async (data: ChargeFormData) => {
    if (!orderId || !orderStatus) {
      toast({
        variant: 'warning',
        title: '🧾 Sin pedido cargado',
        description: 'Carga un pedido de la caja (o una mesa) antes de facturar.',
      });
      return;
    }

    setSaving(true);
    try {
      const invoiceResp = await invoiceService.create({
        orderId,
        customerName: data.name?.trim() || undefined,
        customerIdentification: data.identification?.trim() || undefined,
        customerEmail: data.email?.trim() || undefined,
        // Los pedidos del backend no llevan IVA (total = subtotal − descuento)
        taxes: 0,
        // Propina voluntaria: se guarda en `voluntary_tip`, fuera del total
        voluntaryTip: tip,
        paymentMethod: PAYMENT_METHOD_BY_CART[paymentMethod],
        // La factura nace PENDIENTE: se emite (DIAN) desde Facturación
        status: 'pending',
      });

      if (invoiceResp.code !== 200 && invoiceResp.code !== 201) {
        // 409 = la orden ya tenía factura: igual completamos el cobro
        if (invoiceResp.code !== 409) {
          toast({
            variant: 'warning',
            title: '❌ No se pudo guardar la factura',
            description: apiErrorMessage(invoiceResp, 'Intenta de nuevo.'),
          });
          return;
        }
        toast({
          variant: 'warning',
          title: 'ℹ️ La orden ya tenía factura',
          description: 'Se completa el cobro con la factura existente.',
        });
      }

      for (const status of STATUS_PATH_TO_PAID[orderStatus]) {
        const resp = await orderService.update(orderId, { status });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ No se pudo marcar el pedido como pagado',
            description: apiErrorMessage(resp, 'Intenta de nuevo.'),
          });
          return;
        }
      }

      toast({
        variant: 'success',
        title: '💾 Factura guardada (PENDIENTE)',
        description: orderNumber
          ? `Pedido ${orderNumber} pagado; la factura queda pendiente de emitir y la mesa libre.`
          : 'La factura queda pendiente de emitir.',
      });
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo guardar la factura',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Cobrar pedido{orderNumber ? ` ${orderNumber}` : ''}
          </DialogTitle>
          <DialogDescription>
            Los datos del cliente son opcionales; revisa el total y el cambio antes de finalizar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          {/* Datos del cliente (opcionales) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="charge-name">Nombre del cliente</Label>
              <Input
                id="charge-name"
                placeholder="Juan Pérez"
                autoComplete="off"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="charge-identification">Identificación</Label>
              <Input
                id="charge-identification"
                placeholder="12-34567890-1"
                autoComplete="off"
                {...register('identification')}
              />
              {errors.identification && (
                <p className="text-xs text-destructive">
                  {errors.identification.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="charge-email">Email</Label>
              <Input
                id="charge-email"
                type="email"
                placeholder="cliente@correo.com"
                autoComplete="off"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Resumen de la cuenta */}
          <div className="space-y-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                Propina ({Math.round(tipRate * 100)}%)
                {tip > 0 && (
                  <span className="block text-[11px]">
                    No se factura: es un ingreso del mesero
                  </span>
                )}
              </span>
              <span>{formatCurrency(tip)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descuento</span>
                <span className="text-destructive">−{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total factura</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total a pagar</span>
              <span className="text-primary">{formatCurrency(payable)}</span>
            </div>
          </div>

          {/* Efectivo recibido y cambio */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="charge-received">¿Cuánto recibió?</Label>
              <MoneyInput
                id="charge-received"
                placeholder="0.00"
                value={receivedValue}
                onValueChange={(value) =>
                  setAmountReceived(Number.isFinite(value) ? String(value) : '')
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Cambio a devolver</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3">
                {!hasReceived ? (
                  <span className="text-sm font-semibold text-muted-foreground">—</span>
                ) : change >= 0 ? (
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(change)}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-destructive">
                    Faltan {formatCurrency(-change)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handlePrint}
                disabled={saving}
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleSendEmail}
                disabled={saving}
              >
                <Mail className="h-4 w-4" />
                Enviar email
              </Button>
            </div>
            <Button type="submit" className="gap-2" disabled={saving}>
              <FileText className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
