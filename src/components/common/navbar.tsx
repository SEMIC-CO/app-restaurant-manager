import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  isActive?: boolean;
}

interface NavbarProps {
  businessName: string;
  businessLogo?: string;
  links: NavLink[];
  rightContent?: React.ReactNode;
}

/**
 * Top navigation bar with business branding and page links
 */
export function Navbar({ businessName, businessLogo, links, rightContent }: NavbarProps) {
  return (
    <div className="flex h-[60px] items-center justify-between px-6">
      {/* Left: Logo + Business name */}
      <div className="flex items-center gap-3">
        {businessLogo ? (
          <img 
            src={businessLogo} 
            alt={businessName} 
            className="h-8 w-8 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg">
            🥟
          </div>
        )}
        <span className="text-lg font-bold text-primary">{businessName}</span>
      </div>

      {/* Center: Navigation links */}
      <nav className="hidden items-center gap-1 md:flex">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              link.isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Right: Custom content (notifications, user, etc) */}
      <div className="flex items-center gap-4">
        {rightContent}
      </div>
    </div>
  );
}
