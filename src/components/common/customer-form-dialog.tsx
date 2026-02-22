import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
} from '@/components/ui';

const customerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().regex(/^\+?[0-9\s-()]+$/, 'Teléfono inválido').min(10, 'El teléfono debe tener al menos 10 dígitos'),
  address: z.string().min(10, 'La dirección debe tener al menos 10 caracteres'),
  rut: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerFormData & { id: string };
  onSubmit: (data: CustomerFormData) => Promise<void>;
}

/**
 * Customer form dialog with react-hook-form + zod validation
 * Example implementation for adding/editing customers
 */
export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSubmit,
}: CustomerFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      name: '',
      email: '',
      phone: '',
      address: '',
      rut: '',
    },
  });

  React.useEffect(() => {
    if (open && customer) {
      reset(customer);
    } else if (!open) {
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        rut: '',
      });
    }
  }, [open, customer, reset]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting customer:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</DialogTitle>
          <DialogDescription>
            {customer
              ? 'Actualiza la información del cliente'
              : 'Completa los datos del cliente para facturación'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              placeholder="Juan Pérez"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email and Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+57 300 123 4567"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              placeholder="Calle Principal #123, Ciudad"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* RUT (optional) */}
          <div className="space-y-2">
            <Label htmlFor="rut">RUT / Identificación Fiscal (Opcional)</Label>
            <Input
              id="rut"
              placeholder="12-34567890-1"
              {...register('rut')}
            />
            {errors.rut && (
              <p className="text-xs text-red-500">{errors.rut.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : customer ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
