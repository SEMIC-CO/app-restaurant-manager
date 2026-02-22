import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      status: {
        urgent: 'bg-red-100 text-red-700',
        warning: 'bg-yellow-100 text-yellow-700',
        normal: 'bg-green-100 text-green-700',
        info: 'bg-blue-100 text-blue-700',
        neutral: 'bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      status: 'neutral',
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ReactNode;
}

/**
 * Status badge with color variants for order states
 */
export function StatusBadge({ className, status, icon, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {icon}
      {children}
    </span>
  );
}
