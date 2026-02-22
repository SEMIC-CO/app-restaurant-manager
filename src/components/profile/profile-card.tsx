import { Pencil, Mail, MapPin } from 'lucide-react';
import { Card, Button } from '@/components/ui';

interface UserProfile {
  name: string;
  role: string;
  email: string;
  location: string;
  avatar?: string;
}

interface ProfileCardProps {
  user: UserProfile;
  onEdit?: () => void;
}

/**
 * User profile card with avatar and basic info
 */
export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card bg-green-500" />
          </div>

          {/* Info */}
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-sm text-primary">{user.role}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit button */}
        <Button variant="outline" className="gap-2" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar Perfil
        </Button>
      </div>
    </Card>
  );
}
