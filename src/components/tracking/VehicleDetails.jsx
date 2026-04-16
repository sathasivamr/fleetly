import { Link } from 'react-router-dom';
import {
  Navigation,
  Phone,
  Play,
  Repeat,
  Gauge,
  Fuel,
  Power,
  User,
  MapPin,
  Wrench,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start justify-between py-2.5 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="text-right font-medium text-foreground">{children}</div>
    </div>
  );
}

export default function VehicleDetails({ vehicle }) {
  if (!vehicle) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={Navigation}
          title="No vehicle selected"
          description="Pick a vehicle from the list to see live telemetry and actions."
        />
      </div>
    );
  }

  const fuel = vehicle.fuel ?? 0;
  const fuelTone = fuel < 20 ? 'destructive' : fuel < 40 ? 'warning' : 'success';
  const hasLatLng =
    vehicle.lat != null &&
    vehicle.lng != null &&
    Number.isFinite(Number(vehicle.lat)) &&
    Number.isFinite(Number(vehicle.lng));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-foreground">{vehicle.name ?? '—'}</div>
            <div className="text-xs text-muted-foreground">
              {vehicle.model ?? '—'} · {vehicle.plate ?? '—'}
            </div>
          </div>
          <StatusBadge status={vehicle.status} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Speed
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{vehicle.speed}</div>
            <div className="text-[10px] text-muted-foreground">mph</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Fuel
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fuel}%</div>
            <Progress value={fuel} tone={fuelTone} className="mt-1.5" />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Odometer
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {(vehicle.odometer ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">mi</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        {hasLatLng && (
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm ring-1 ring-primary/10">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              Current location
            </div>
            {vehicle.address ? (
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">{vehicle.address}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Address not provided by the server yet — coordinates below. Traccar fills this when
                geocoding is enabled.
              </p>
            )}
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              {Number(vehicle.lat).toFixed(5)}, {Number(vehicle.lng).toFixed(5)}
            </p>
            <p className="mt-2 border-t border-primary/15 pt-2 text-[11px] text-muted-foreground">
              Last update: <span className="font-medium text-foreground">{formatDate(vehicle.lastUpdate)}</span>
            </p>
          </div>
        )}

        <div className="divide-y divide-border">
          <Row icon={Power} label="Ignition">
            {vehicle.ignition ? (
              <span className="text-success">On</span>
            ) : (
              <span className="text-muted-foreground">Off</span>
            )}
          </Row>
          <Row icon={User} label="Driver">
            {vehicle.driver}
          </Row>
          <Row icon={Activity} label="Group">
            {vehicle.group}
          </Row>
          <Row icon={Gauge} label="Current trip">
            {vehicle.currentTripId || '—'}
          </Row>
          <Row icon={Fuel} label="VIN">
            <span className="font-mono text-xs">{vehicle.vin}</span>
          </Row>
          <Row icon={Wrench} label="Last update">
            {formatDate(vehicle.lastUpdate)}
          </Row>
        </div>

        <Separator className="my-5" />

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="default" asChild>
            <Link to="/tracking">
              <Navigation className="h-4 w-4" /> Live map
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/replay">
              <Play className="h-4 w-4" /> Replay
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/vehicles/${vehicle.id}`}>
              <Repeat className="h-4 w-4" /> Device
            </Link>
          </Button>
          <Button size="sm" variant="outline" type="button" disabled title="Wire to driver phone when available">
            <Phone className="h-4 w-4" /> Call
          </Button>
        </div>
      </div>
    </div>
  );
}
