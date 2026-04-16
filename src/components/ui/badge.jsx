import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'text-foreground ring-1 ring-inset ring-border',
        success: 'bg-success/10 text-success ring-1 ring-inset ring-success/20',
        warning: 'bg-warning/10 text-warning-foreground ring-1 ring-inset ring-warning/30',
        destructive: 'bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20',
        muted: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
