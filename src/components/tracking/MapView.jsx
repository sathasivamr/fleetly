import { useMemo, useState } from 'react';
import { Map as MapIcon, Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';
import FleetMapLibre from '@/components/tracking/FleetMapLibre';

function validLatLng(lat, lng) {
  if (lat == null || lng == null) return false;
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (la === 0 && ln === 0) return false;
  return la >= -90 && la <= 90 && ln >= -180 && ln <= 180;
}

/**
 * Live map: Google-style road or satellite basemap + car image markers for every device with coordinates.
 */
export default function MapView({ vehicles, selectedId, onSelect }) {
  const [basemap, setBasemap] = useState('road');

  const noPositionCount = useMemo(
    () => vehicles.filter((v) => !validLatLng(v.lat, v.lng)).length,
    [vehicles],
  );
  const anyPosition = useMemo(
    () => vehicles.some((v) => validLatLng(v.lat, v.lng)),
    [vehicles],
  );
  return (
    <div className="relative h-full w-full min-h-[200px] overflow-hidden rounded-none bg-background">
      <FleetMapLibre
        className="absolute inset-0"
        vehicles={vehicles}
        selectedId={selectedId != null ? String(selectedId) : null}
        onSelectVehicle={(id) => {
          const v = vehicles.find((x) => String(x.id) === String(id));
          if (v) onSelect?.(v);
        }}
        showControls
        showGeolocate={false}
        fitPadding={56}
        basemap={basemap}
      />

      <div className="absolute left-4 top-4 z-20 flex items-center gap-0.5 rounded-lg border border-border bg-card/95 p-0.5 shadow-md backdrop-blur">
        <button
          type="button"
          onClick={() => setBasemap('road')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            basemap === 'road' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
          )}
        >
          <MapIcon className="h-3.5 w-3.5" />
          Map
        </button>
        <button
          type="button"
          onClick={() => setBasemap('satellite')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            basemap === 'satellite' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
          )}
        >
          <Satellite className="h-3.5 w-3.5" />
          Satellite
        </button>
      </div>

      {!anyPosition && vehicles.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-10 max-w-[90%] -translate-x-1/2 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-xs text-muted-foreground shadow-sm backdrop-blur">
          No GPS positions yet — markers appear when the server reports coordinates.
        </div>
      )}

      {noPositionCount > 0 && anyPosition && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-10 max-w-[90%] -translate-x-1/2 rounded-md border border-border bg-card/95 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
          {noPositionCount} of {vehicles.length} device{vehicles.length === 1 ? '' : 's'} have no coordinates — every device with GPS is shown
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-2 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600" /> Moving
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-600" /> Idle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-500" /> Stopped
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-600" /> Offline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-600" /> Alert
        </span>
      </div>
    </div>
  );
}
