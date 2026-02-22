import { Clock, User } from 'lucide-react';
import type { Shift, User as UserType } from '@/types';

interface HeaderProps {
  businessName: string;
  businessLogo?: string;
  shift?: Shift;
  user?: UserType;
}

/**
 * Main header component with business info, shift display, and user avatar
 */
export function Header({ businessName, businessLogo, shift, user }: HeaderProps) {
  return (
    <div className="flex h-[72px] items-center justify-between px-6">
      {/* Business Identity */}
      <div className="flex items-center gap-3">
        {businessLogo ? (
          <img 
            src={businessLogo} 
            alt={businessName} 
            className="h-10 w-10 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xl">
            🥟
          </div>
        )}
        <h1 className="text-xl font-bold text-foreground">{businessName}</h1>
      </div>

      {/* Right side: Shift + User */}
      <div className="flex items-center gap-6">
        {/* Shift info */}
        {shift && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Shift: {shift.name} ({shift.startTime} - {shift.endTime})</span>
          </div>
        )}

        {/* User avatar */}
        {user ? (
          <div className="flex items-center gap-2">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden text-sm font-medium md:inline">
              {user.name}
            </span>
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
