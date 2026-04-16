import { AlertTriangle, Fuel, MapPinOff, Gauge, Wrench } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';

const ICONS = {
  overspeed: Gauge,
  fuel: Fuel,
  geofence: MapPinOff,
  idle: AlertTriangle,
  engine: Wrench,
};

export default function AlertsPanel({ alerts = [] }) {
  const open = alerts.filter((a) => a.status === 'open').slice(0, 5);
  if (!open.length) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">No open alerts from the server</div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {open.map((a) => {
        const Icon = ICONS[a.type] || AlertTriangle;
        return (
          <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                a.severity === 'high' && 'bg-destructive/10 text-destructive',
                a.severity === 'medium' && 'bg-warning/10 text-warning-foreground',
                a.severity === 'low' && 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-medium">{a.message}</div>
                <StatusBadge status={a.severity} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {a.vehicle} · {a.driver}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
