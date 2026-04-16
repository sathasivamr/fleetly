import { Badge } from '@/components/ui/badge';

const STATUS_MAP = {
  moving: { label: 'Moving', variant: 'success' },
  idle: { label: 'Idle', variant: 'warning' },
  stopped: { label: 'Stopped', variant: 'muted' },
  alert: { label: 'Alert', variant: 'destructive' },
  maintenance: { label: 'In service', variant: 'outline' },
  offline: { label: 'Offline', variant: 'muted' },
  'on-trip': { label: 'On trip', variant: 'success' },
  'off-duty': { label: 'Off-duty', variant: 'muted' },
  open: { label: 'Open', variant: 'destructive' },
  resolved: { label: 'Resolved', variant: 'success' },
  'in-progress': { label: 'In progress', variant: 'default' },
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'success' },
  high: { label: 'High', variant: 'destructive' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'muted' },
};

export default function StatusBadge({ status, label }) {
  const cfg = STATUS_MAP[status] || { label: status, variant: 'muted' };
  const dotColor = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    default: 'bg-primary',
    muted: 'bg-muted-foreground/60',
    outline: 'bg-muted-foreground/60',
    secondary: 'bg-muted-foreground/60',
  }[cfg.variant];

  return (
    <Badge variant={cfg.variant}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label || cfg.label}
    </Badge>
  );
}
