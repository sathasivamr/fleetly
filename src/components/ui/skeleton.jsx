import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/60',
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-24" />
      <Skeleton className="mt-3 h-3 w-16" />
    </div>
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 flex-1" />
      ))}
    </div>
  );
}

export default Skeleton;
