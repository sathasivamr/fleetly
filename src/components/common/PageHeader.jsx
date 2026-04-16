import { cn } from '@/lib/utils';
import LiveDot from '@/components/common/LiveDot';

export default function PageHeader({
  title,
  description,
  actions,
  className,
  children,
  live,
  liveLabel,
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {live !== undefined && <LiveDot connected={live} label={liveLabel} />}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
