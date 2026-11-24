import { User, Mail, Phone, MapPin } from 'lucide-react';
import { Card, Button } from '@/components/ui';

interface CustomerInfo {
  name: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
}

interface CustomerInfoCardProps {
  customer: CustomerInfo;
  onEdit?: () => void;
}

/**
 * Customer information card for invoice detail
 */
export function CustomerInfoCard({ customer, onEdit }: CustomerInfoCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Información del Cliente</h3>
        </div>
        {onEdit && (
          <Button 
            variant="link"
            onClick={onEdit}
            className="text-sm"
          >
            Editar datos
          </Button>
        )}
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-2xl">
          👤
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-2">
          <h4 className="text-lg font-semibold">{customer.name}</h4>
          
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 [&_span]:break-words">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>ID: {customer.rut}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{customer.address}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
