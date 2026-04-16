import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import EmptyState from '@/components/common/EmptyState';
import { useLiveData } from '@/context/LiveDataContext';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const SPEEDS = [0.5, 1, 2, 4, 8];

function rangeIso(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function ReplayPage() {
  const { devices } = useLiveData();
  const [deviceId, setDeviceId] = useState('');
  const [rangeDays, setRangeDays] = useState(1);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  useEffect(() => {
    if (!devices.length || deviceId) return;
    setDeviceId(String(devices[0].id));
  }, [devices, deviceId]);

  // Fetch route on device/range change.
  useEffect(() => {
    if (!deviceId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRoute([]);
    setCursor(0);
    setPlaying(false);
    const { from, to } = rangeIso(rangeDays);
    (async () => {
      try {
        const rows = await api.reports.route({ from, to, deviceId: [Number(deviceId)] });
        if (cancelled) return;
        const clean = (rows || []).filter(
          (p) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)),
        );
        setRoute(clean);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load route');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceId, rangeDays]);

  // Initialize map once.
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return undefined;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLE,
      center: [0, 20],
      zoom: 2,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw polyline when route changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const draw = () => {
      const coords = route.map((p) => [Number(p.longitude), Number(p.latitude)]);
      if (map.getLayer('route-line')) map.removeLayer('route-line');
      if (map.getSource('route')) map.removeSource('route');
      if (coords.length < 1) return;
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-opacity': 0.85 },
      });

      if (!markerRef.current) {
        const el = document.createElement('div');
        el.style.width = '18px';
        el.style.height = '18px';
        el.style.borderRadius = '50%';
        el.style.background = '#2563eb';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(coords[0]).addTo(map);
      } else {
        markerRef.current.setLngLat(coords[0]);
      }

      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );
      map.fitBounds(bounds, { padding: 60, duration: 500 });
    };

    if (map.loaded()) draw();
    else map.once('load', draw);
  }, [route]);

  // Move marker when cursor changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markerRef.current || !route.length) return;
    const p = route[Math.min(cursor, route.length - 1)];
    if (!p) return;
    markerRef.current.setLngLat([Number(p.longitude), Number(p.latitude)]);
  }, [cursor, route]);

  // Playback loop.
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return undefined;
    }
    lastTsRef.current = 0;
    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      // Advance ~1 point every (120/speed) ms.
      const stepMs = 120 / speed;
      if (dt >= stepMs) {
        lastTsRef.current = ts;
        setCursor((c) => {
          if (c + 1 >= route.length) {
            setPlaying(false);
            return route.length - 1;
          }
          return c + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, route.length]);

  const current = route[cursor] || null;
  const total = route.length;
  const deviceName = useMemo(
    () => devices.find((d) => String(d.id) === String(deviceId))?.name || 'Device',
    [devices, deviceId],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Replay"
        description="Scrub through historical movement from the Traccar route report."
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Select trip</CardTitle>
          <CardDescription>Pick a device and time range to load positions.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium">
            Device
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="bg-transparent text-foreground outline-none"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium">
            Range
            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="bg-transparent text-foreground outline-none"
            >
              <option value={1}>Last 24 hours</option>
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </label>
          <div className="ml-auto text-xs text-muted-foreground">
            {loading ? 'Loading route…' : `${total} positions · ${deviceName}`}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div ref={mapContainerRef} className="h-[520px] w-full" />
        {total === 0 && !loading ? (
          <div className="border-t border-border p-6">
            <EmptyState
              title="No positions in range"
              description="Try a wider time range or pick a different device."
            />
          </div>
        ) : (
          <div className="border-t border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setPlaying(false);
                  setCursor(0);
                }}
                disabled={!total}
                aria-label="Rewind"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={() => setPlaying((p) => !p)}
                disabled={!total || cursor >= total - 1}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setPlaying(false);
                  setCursor(total ? total - 1 : 0);
                }}
                disabled={!total}
                aria-label="Jump to end"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      speed === s
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <div className="ml-auto text-xs tabular-nums text-muted-foreground">
                {total ? `${cursor + 1} / ${total}` : '—'}
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(0, total - 1)}
              value={cursor}
              onChange={(e) => {
                setPlaying(false);
                setCursor(Number(e.target.value));
              }}
              disabled={!total}
              className="w-full accent-primary"
            />

            {current && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <div>
                  <div className="uppercase tracking-wide">Time</div>
                  <div className="text-foreground">{formatDate(current.fixTime || current.deviceTime)}</div>
                </div>
                <div>
                  <div className="uppercase tracking-wide">Speed</div>
                  <div className="text-foreground tabular-nums">
                    {Math.round((Number(current.speed) || 0) * 1.15078)} mph
                  </div>
                </div>
                <div>
                  <div className="uppercase tracking-wide">Coords</div>
                  <div className="font-mono text-foreground">
                    {Number(current.latitude).toFixed(5)}, {Number(current.longitude).toFixed(5)}
                  </div>
                </div>
                <div>
                  <div className="uppercase tracking-wide">Address</div>
                  <div className="line-clamp-1 text-foreground">{current.address || '—'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
