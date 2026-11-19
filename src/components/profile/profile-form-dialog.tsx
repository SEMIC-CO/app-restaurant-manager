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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { locationService } from '@/services';
import type { AuthProfile, City, Country, Departament } from '@/types';

/** El selector de Radix no admite `value=""`: esta marca significa "sin valor". */
const NO_VALUE = 'none';

const profileSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  telephone: z
    .string()
    .max(15, 'Máximo 15 caracteres')
    .regex(/^[0-9+()\s-]*$/, 'Solo números y los símbolos + ( ) -'),
  companyName: z
    .string()
    .trim()
    .min(1, 'El nombre de la empresa no puede quedar vacío')
    .max(100, 'Máximo 100 caracteres'),
  headquarterName: z
    .string()
    .trim()
    .min(1, 'El nombre de la sede no puede quedar vacío')
    .max(100, 'Máximo 100 caracteres'),
  address: z.string().max(100, 'Máximo 100 caracteres'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Ubicación de la sede (país → departamento → ciudad). Se envía completa o
 * no se envía: no tiene sentido guardar un país sin su ciudad.
 */
export interface LocationFormData {
  countryId: number;
  departamentId: number;
  cityId: number;
}

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Perfil actual: con él se precargan todos los campos al abrir. */
  profile: AuthProfile;
  /**
   * Guarda en el backend (tres endpoints: perfil, empresa y sede); si
   * alguno rechaza, el diálogo queda abierto.
   */
  onSubmit: (
    values: ProfileFormData,
    location: LocationFormData | null,
  ) => Promise<void>;
}

/**
 * Edita el perfil propio y los datos de su empresa y sede
 * (react-hook-form + zod + shadcn/ui, patrón de FORMS-GUIDE.md).
 *
 * Los textos van en el formulario; los tres selectores de ubicación viven
 * en estado local porque son una cadena dependiente (al cambiar el país se
 * limpian departamento y ciudad) y Radix no admite valores vacíos.
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
      companyName: profile.company?.name ?? '',
      headquarterName: profile.headquarter?.name ?? '',
      address: profile.headquarter?.address ?? '',
    },
  });

  const [countries, setCountries] = React.useState<Country[]>([]);
  const [departaments, setDepartaments] = React.useState<Departament[]>([]);
  const [cities, setCities] = React.useState<City[]>([]);
  const [countryId, setCountryId] = React.useState<number | null>(null);
  const [departamentId, setDepartamentId] = React.useState<number | null>(null);
  const [cityId, setCityId] = React.useState<number | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [listsError, setListsError] = React.useState<string | null>(null);

  // Al abrir: precarga desde el perfil y trae el catálogo de países.
  React.useEffect(() => {
    if (!open) return;

    const headquarter = profile.headquarter;
    reset({
      name: profile.name,
      email: profile.email,
      telephone: profile.telephone ?? '',
      companyName: profile.company?.name ?? '',
      headquarterName: headquarter?.name ?? '',
      address: headquarter?.address ?? '',
    });
    setCountryId(headquarter?.countryId ?? null);
    setDepartamentId(headquarter?.departamentId ?? null);
    setCityId(headquarter?.cityId ?? null);
    setLocationError(null);
    setListsError(null);

    let active = true;
    void locationService
      .listCountries()
      .then((list) => {
        if (active) setCountries(list);
      })
      .catch(() => {
        if (active) setListsError('No se pudo cargar el catálogo de países.');
      });

    return () => {
      active = false;
    };
  }, [open, profile, reset]);

  // País → departamentos
  React.useEffect(() => {
    if (!open) return;
    if (!countryId) {
      setDepartaments([]);
      return;
    }
    let active = true;
    void locationService
      .listDepartaments(countryId)
      .then((list) => {
        if (active) setDepartaments(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open, countryId]);

  // Departamento → ciudades
  React.useEffect(() => {
    if (!open) return;
    if (!departamentId) {
      setCities([]);
      return;
    }
    let active = true;
    void locationService
      .listCities(departamentId)
      .then((list) => {
        if (active) setCities(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open, departamentId]);

  const handleCountryChange = (value: string) => {
    setCountryId(value === NO_VALUE ? null : Number(value));
    // La ciudad pertenece al departamento anterior: se limpian los dos.
    setDepartamentId(null);
    setCityId(null);
    setLocationError(null);
  };

  const handleDepartamentChange = (value: string) => {
    setDepartamentId(value === NO_VALUE ? null : Number(value));
    setCityId(null);
    setLocationError(null);
  };

  const handleCityChange = (value: string) => {
    setCityId(value === NO_VALUE ? null : Number(value));
    setLocationError(null);
  };

  const handleFormSubmit = async (values: ProfileFormData) => {
    const picked = [countryId, departamentId, cityId];
    const somePicked = picked.some((value) => value !== null);
    const allPicked = picked.every((value) => value !== null);

    if (somePicked && !allPicked) {
      setLocationError(
        'Completa país, departamento y ciudad, o déjalos los tres vacíos.',
      );
      return;
    }
    setLocationError(null);

    try {
      await onSubmit(
        values,
        allPicked
          ? {
              countryId: countryId as number,
              departamentId: departamentId as number,
              cityId: cityId as number,
            }
          : null,
      );
    } catch {
      // El caller ya mostró el aviso; el diálogo queda abierto para corregir.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Tus datos, los de tu empresa y la ubicación de tu sede.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          {/* Tus datos */}
          <section className="space-y-4">
            <p className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Tus datos
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
            </div>
          </section>

          {/* Empresa y sede */}
          <section className="space-y-4">
            <p className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Empresa y sede
            </p>

            <div className="space-y-2">
              <Label htmlFor="profile-company">Nombre de la empresa *</Label>
              <Input
                id="profile-company"
                placeholder="Nombre del negocio"
                {...register('companyName')}
              />
              {errors.companyName && (
                <p className="text-xs text-destructive">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-headquarter">Nombre de la sede *</Label>
                <Input
                  id="profile-headquarter"
                  placeholder="Sede principal"
                  {...register('headquarterName')}
                />
                {errors.headquarterName && (
                  <p className="text-xs text-destructive">
                    {errors.headquarterName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-address">Dirección</Label>
                <Input
                  id="profile-address"
                  placeholder="Calle 1 #2-3"
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-xs text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="profile-country">País</Label>
                <Select
                  value={countryId === null ? NO_VALUE : String(countryId)}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger id="profile-country">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VALUE}>Sin país</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={String(country.id)}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-departament">Departamento</Label>
                <Select
                  value={departamentId === null ? NO_VALUE : String(departamentId)}
                  onValueChange={handleDepartamentChange}
                  disabled={countryId === null || departaments.length === 0}
                >
                  <SelectTrigger id="profile-departament">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VALUE}>Sin departamento</SelectItem>
                    {departaments.map((departament) => (
                      <SelectItem
                        key={departament.id}
                        value={String(departament.id)}
                      >
                        {departament.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-city">Ciudad</Label>
                <Select
                  value={cityId === null ? NO_VALUE : String(cityId)}
                  onValueChange={handleCityChange}
                  disabled={departamentId === null || cities.length === 0}
                >
                  <SelectTrigger id="profile-city">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VALUE}>Sin ciudad</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(locationError || listsError) && (
              <p className="text-xs text-destructive">
                {locationError ?? listsError}
              </p>
            )}
          </section>

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
