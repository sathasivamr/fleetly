import { cn } from '@/lib/utils';

export default function LiveDot({ connected = true, label, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        connected
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-muted-foreground/20 bg-muted text-muted-foreground',
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            connected ? 'bg-success' : 'bg-muted-foreground',
          )}
        />
      </span>
      {label || (connected ? 'Live' : 'Offline')}
    </span>
  );
}
