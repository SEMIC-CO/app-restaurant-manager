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
  Switch,
} from '@/components/ui';
import type { ApiEmployee } from '@/types';

const employeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  noDocument: z
    .string()
    .trim()
    .regex(/^\d*$/, 'El documento solo puede contener dígitos')
    .refine((value) => value.length <= 18, 'El documento no puede superar 18 dígitos'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{1,18}$/, 'El teléfono debe ser numérico y tener máximo 18 dígitos'),
  email: z.union([
    z.literal(''),
    z
      .string()
      .trim()
      .email('Correo electrónico inválido')
      .max(100, 'El correo no puede superar los 100 caracteres'),
  ]),
  birthdate: z
    .string()
    .refine(
      (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
      'Selecciona una fecha válida',
    ),
  active: z.boolean(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita el empleado; si no, crea uno nuevo. */
  employee?: ApiEmployee;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
}

/**
 * Formulario de empleado (crear/editar): documento, nombre, teléfono, correo,
 * fecha de nacimiento y estado. Sigue el patrón de CategoryFormDialog: el
 * diálogo se cierra solo si `onSubmit` resuelve; si lanza, permanece abierto.
 */
export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSubmit,
}: EmployeeFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      noDocument: '',
      phone: '',
      email: '',
      birthdate: '',
      active: true,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: employee?.name ?? '',
        noDocument: employee?.noDocument ?? '',
        phone: employee?.phone ?? '',
        email: employee?.email ?? '',
        birthdate: employee?.birthdate ?? '',
        active: employee?.active ?? true,
      });
    } else {
      reset({ name: '', noDocument: '', phone: '', email: '', birthdate: '', active: true });
    }
  }, [open, employee, reset]);

  const handleFormSubmit = async (data: EmployeeFormData) => {
    try {
      await onSubmit({
        ...data,
        name: data.name.trim(),
        noDocument: data.noDocument.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando empleado:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
          <DialogDescription>
            {employee
              ? 'Actualiza los datos del empleado de tu sede'
              : 'Registra a un empleado de la sede para pagarlo y manejarle adelantos o descuentos'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee-name">Nombre completo *</Label>
            <Input id="employee-name" placeholder="Ana Pérez" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee-document">Documento</Label>
              <Input
                id="employee-document"
                inputMode="numeric"
                placeholder="1712345678"
                {...register('noDocument')}
              />
              {errors.noDocument && (
                <p className="text-xs text-red-500">{errors.noDocument.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-phone">Teléfono *</Label>
              <Input
                id="employee-phone"
                inputMode="numeric"
                placeholder="0991234567"
                {...register('phone')}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-email">Correo electrónico</Label>
            <Input
              id="employee-email"
              type="email"
              placeholder="ana@restaurante.com"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-birthdate">Fecha de nacimiento</Label>
            <Input id="employee-birthdate" type="date" {...register('birthdate')} />
            {errors.birthdate && (
              <p className="text-xs text-red-500">{errors.birthdate.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="employee-active" className="text-sm font-medium">
                Empleado activo
              </Label>
              <p className="text-xs text-muted-foreground">
                Los inactivos no aparecen en el filtro por defecto
              </p>
            </div>
            <Switch id="employee-active" {...register('active')} />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : employee ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
