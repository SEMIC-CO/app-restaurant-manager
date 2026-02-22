import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui';
import type { User as UserType } from '@/types';

interface UserMenuProps {
  user?: UserType;
}

/**
 * User menu with notifications and avatar
 */
export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          3
        </span>
      </Button>

      {/* User avatar */}
      {user ? (
        <div className="flex items-center gap-2">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
