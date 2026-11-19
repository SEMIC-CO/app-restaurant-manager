import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
} from '@/components/ui';
import type { AuthProfile } from '@/types';

const profileSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  telephone: z
    .string()
    .max(15, 'Máximo 15 caracteres')
    .regex(/^[0-9+()\s-]*$/, 'Solo números y los símbolos + ( ) -'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Perfil actual: con él se precargan los campos al abrir. */
  profile: AuthProfile;
  /** Guarda en el backend; si rechaza el diálogo queda abierto. */
  onSubmit: (values: ProfileFormData) => Promise<void>;
}

/**
 * Edita nombre, correo y teléfono del propio perfil
 * (react-hook-form + zod + shadcn/ui, patrón de FORMS-GUIDE.md).
 */
export function ProfileFormDialog({
  open,
  onOpenChange,
  profile,
  onSubmit,
}: ProfileFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      email: profile.email,
      telephone: profile.telephone ?? '',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: profile.name,
        email: profile.email,
        telephone: profile.telephone ?? '',
      });
    }
  }, [open, profile, reset]);

  const handleFormSubmit = async (values: ProfileFormData) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch {
      // El caller ya mostró el aviso; el diálogo se queda abierto para
      // que el usuario corrija (p. ej. correo ya registrado → 409).
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Actualiza tus datos personales. El correo debe ser único en el
            sistema.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nombre *</Label>
            <Input
              id="profile-name"
              placeholder="Tu nombre"
              autoComplete="name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Correo electrónico *</Label>
            <Input
              id="profile-email"
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-telephone">Teléfono</Label>
            <Input
              id="profile-telephone"
              type="tel"
              placeholder="300 123 4567"
              autoComplete="tel"
              {...register('telephone')}
            />
            {errors.telephone && (
              <p className="text-xs text-destructive">
                {errors.telephone.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Déjalo vacío si no quieres registrar uno.
            </p>
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
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
