import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Progress = forwardRef(({ className, value = 0, tone = 'primary', ...props }, ref) => {
  const toneClass = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  }[tone];

  return (
    <div
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all', toneClass)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
});
Progress.displayName = 'Progress';

export { Progress };
