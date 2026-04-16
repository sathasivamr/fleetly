import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';

export default function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel = 'vs last week',
  tone = 'default',
}) {
  const toneRing = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning-foreground',
    destructive: 'bg-destructive/10 text-destructive',
  }[tone];

  const isUp = typeof delta === 'number' && delta >= 0;
  const numericValue = typeof value === 'number' ? value : Number(value);
  const isNumeric = Number.isFinite(numericValue);

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {isNumeric ? <AnimatedCounter value={numericValue} /> : value}
          </div>
          {typeof delta === 'number' && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-medium',
                isUp ? 'text-success' : 'text-destructive',
              )}
            >
              {isUp ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(delta)}%
              <span className="ml-1 font-normal text-muted-foreground">{deltaLabel}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              toneRing,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
