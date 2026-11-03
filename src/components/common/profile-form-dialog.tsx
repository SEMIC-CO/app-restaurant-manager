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
import type { ApiProfile } from '@/types';

/**
 * Nombre del perfil (máx. 50, como exige `CreateProfileDto`).
 * El backend no valida duplicados, así que el caller decide si lo comprueba.
 */
const profileSchema = z.object({
  profile: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar los 50 caracteres'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita el perfil; si no, crea uno nuevo. */
  profile?: ApiProfile;
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

/**
 * Formulario de perfil de usuario (crear/editar): solo el nombre, que es lo
 * que acepta el backend (`CreateProfileDto`/`UpdateProfileDto`).
 * El diálogo se cierra solo si `onSubmit` resuelve; si lanza, permanece abierto.
 */
export function ProfileFormDialog({
  open,
  onOpenChange,
  profile,
  onSubmit,
}: ProfileFormDialogProps) {
  const isEdit = Boolean(profile);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { profile: '' },
  });

  React.useEffect(() => {
    if (open) {
      reset({ profile: profile?.profile ?? '' });
    } else {
      reset({ profile: '' });
    }
  }, [open, profile, reset]);

  const handleFormSubmit = async (data: ProfileFormData) => {
    try {
      await onSubmit({ profile: data.profile.trim() });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando perfil:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar perfil' : 'Nuevo perfil'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza el nombre del perfil'
              : 'Crea un perfil para agrupar los permisos de tus usuarios'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nombre del perfil *</Label>
            <Input
              id="profile-name"
              placeholder="Ej. Cajero, Gerente, Cocina"
              maxLength={50}
              {...register('profile')}
            />
            {errors.profile && (
              <p className="text-xs text-red-500">{errors.profile.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Después podrás asignarle permisos y usarlo al crear usuarios.
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
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
