import { Building2, Mail, MapPin, Phone, Pencil, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { AuthProfile } from '@/types';

interface ProfileCardProps {
  profile: AuthProfile;
  onEdit: () => void;
}

/** Iniciales del nombre (hasta 2 letras) para el avatar. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm">{value}</p>
      </div>
    </div>
  );
}

/**
 * Datos del usuario autenticado (API real `GET /auth/profile`): avatar con
 * iniciales, perfil, correo, teléfono, empresa y sede, con la acción para
 * editarlos.
 */
export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  const isActive = profile.status === 'ACTIVO';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {initials(profile.name)}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-xl">{profile.name}</CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                {profile.profile?.name ?? 'Sin perfil asignado'}
              </Badge>
              {profile.isOwner && <Badge variant="outline">Propietario</Badge>}
              <Badge
                variant={isActive ? 'default' : 'destructive'}
                className="uppercase"
              >
                {profile.status}
              </Badge>
            </div>
          </div>
        </div>

        <Button variant="outline" className="gap-2" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar perfil
        </Button>
      </CardHeader>

      <CardContent>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetaRow icon={Mail} label="Correo" value={profile.email} />
          <MetaRow
            icon={Phone}
            label="Teléfono"
            value={profile.telephone?.trim() ? profile.telephone : 'Sin registrar'}
          />
          <MetaRow
            icon={Building2}
            label="Empresa"
            value={profile.company?.name ?? 'Sin empresa'}
          />
          <MetaRow
            icon={MapPin}
            label="Sede"
            value={
              profile.headquarter
                ? profile.headquarter.name +
                  (profile.headquarter.address ? ` — ${profile.headquarter.address}` : '')
                : 'Sin sede asignada'
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
