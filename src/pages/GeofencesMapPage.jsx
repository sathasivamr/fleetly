import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Pencil, Save, Trash2, X } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { api } from '@/lib/api';
import { useFlash } from '@/context/FlashContext';

const STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// Traccar WKT uses "lat lon" order (not "lon lat"). Parse polygons and circles.
function parseWkt(wkt) {
  if (!wkt || typeof wkt !== 'string') return null;
  const s = wkt.trim();
  const polyMatch = s.match(/^POLYGON\s*\(\(([^)]+)\)\)/i);
  if (polyMatch) {
    const coords = polyMatch[1]
      .split(',')
      .map((pair) => pair.trim().split(/\s+/).map(Number))
      .filter((p) => p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map(([lat, lon]) => [lon, lat]);
    if (coords.length < 3) return null;
    return { type: 'polygon', coordinates: [coords] };
  }
  const circleMatch = s.match(/^CIRCLE\s*\(([^,]+),\s*([\d.]+)\)/i);
  if (circleMatch) {
    const [lat, lon] = circleMatch[1].trim().split(/\s+/).map(Number);
    const radius = Number(circleMatch[2]);
    if ([lat, lon, radius].every(Number.isFinite)) {
      return { type: 'circle', center: [lon, lat], radius };
    }
  }
  return null;
}

function polygonToWkt(lnglats) {
  // Close the ring
  const ring = [...lnglats, lnglats[0]];
  const parts = ring.map(([lng, lat]) => `${lat} ${lng}`).join(', ');
  return `POLYGON ((${parts}))`;
}

function circleToGeoJson(center, radius, steps = 64) {
  const [lng, lat] = center;
  const coords = [];
  const R = 6378137;
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = (radius * Math.cos(angle)) / (R * Math.cos((lat * Math.PI) / 180));
    const dy = (radius * Math.sin(angle)) / R;
    coords.push([lng + (dx * 180) / Math.PI, lat + (dy * 180) / Math.PI]);
  }
  return coords;
}

function geofenceToFeature(g) {
  const geom = parseWkt(g.area);
  if (!geom) return null;
  if (geom.type === 'polygon') {
    return {
      type: 'Feature',
      id: g.id,
      properties: { id: g.id, name: g.name },
      geometry: { type: 'Polygon', coordinates: geom.coordinates },
    };
  }
  if (geom.type === 'circle') {
    return {
      type: 'Feature',
      id: g.id,
      properties: { id: g.id, name: g.name },
      geometry: {
        type: 'Polygon',
        coordinates: [circleToGeoJson(geom.center, geom.radius)],
      },
    };
  }
  return null;
}

export default function GeofencesMapPage() {
  const { showSuccess, showError } = useFlash();
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]); // [lng, lat]
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapLoadedRef = useRef(false);

  const fetchGeofences = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await api.geofences.list();
      setGeofences(Array.isArray(list) ? list : []);
    } catch (e) {
      setLoadError(e.message || 'Failed to load geofences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  // Initialize map.
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return undefined;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLE,
      center: [0, 20],
      zoom: 2,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      mapLoadedRef.current = true;
      map.addSource('geofences', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'geofences-fill',
        type: 'fill',
        source: 'geofences',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'id'], ['literal', null]],
            '#2563eb',
            '#2563eb',
          ],
          'fill-opacity': 0.15,
        },
      });
      map.addLayer({
        id: 'geofences-outline',
        type: 'line',
        source: 'geofences',
        paint: { 'line-color': '#2563eb', 'line-width': 2 },
      });
      map.addLayer({
        id: 'geofences-label',
        type: 'symbol',
        source: 'geofences',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#1e3a8a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      map.addSource('draft', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'draft-fill',
        type: 'fill',
        source: 'draft',
        paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.2 },
        filter: ['==', '$type', 'Polygon'],
      });
      map.addLayer({
        id: 'draft-line',
        type: 'line',
        source: 'draft',
        paint: { 'line-color': '#f59e0b', 'line-width': 2, 'line-dasharray': [2, 2] },
      });
      map.addLayer({
        id: 'draft-points',
        type: 'circle',
        source: 'draft',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#f59e0b',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
    });

    map.on('click', 'geofences-fill', (e) => {
      const f = e.features?.[0];
      if (f) setSelectedId(f.properties.id);
    });
    map.on('mouseenter', 'geofences-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'geofences-fill', () => {
      map.getCanvas().style.cursor = '';
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      mapLoadedRef.current = false;
    };
  }, []);

  // Render geofences to the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource('geofences');
      if (!src) return;
      const features = geofences.map(geofenceToFeature).filter(Boolean);
      src.setData({ type: 'FeatureCollection', features });
      if (features.length && !drawing) {
        try {
          const bounds = new maplibregl.LngLatBounds();
          features.forEach((f) => {
            f.geometry.coordinates[0].forEach((c) => bounds.extend(c));
          });
          if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, duration: 500, maxZoom: 14 });
        } catch {
          /* ignore */
        }
      }
    };
    if (mapLoadedRef.current) apply();
    else map.once('load', apply);
  }, [geofences, drawing]);

  // Render draft while drawing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const src = map.getSource('draft');
    if (!src) return;
    const features = [];
    if (draftPoints.length >= 3) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[...draftPoints, draftPoints[0]]] },
      });
    } else if (draftPoints.length === 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: draftPoints },
      });
    }
    draftPoints.forEach((p) =>
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: p } }),
    );
    src.setData({ type: 'FeatureCollection', features });
  }, [draftPoints]);

  // Click-to-add vertex during draw mode.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const handler = (e) => {
      if (!drawing) return;
      setDraftPoints((prev) => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
    };
    map.on('click', handler);
    map.getCanvas().style.cursor = drawing ? 'crosshair' : '';
    return () => {
      map.off('click', handler);
      if (map.getCanvas()) map.getCanvas().style.cursor = '';
    };
  }, [drawing]);

  const startDraw = () => {
    setDrawing(true);
    setDraftPoints([]);
    setDraftName('');
    setSelectedId(null);
  };

  const cancelDraw = () => {
    setDrawing(false);
    setDraftPoints([]);
    setDraftName('');
  };

  const saveDraft = async () => {
    if (draftPoints.length < 3) {
      showError('Add at least 3 points to create a polygon');
      return;
    }
    const name = draftName.trim() || `Zone ${new Date().toISOString().slice(0, 16)}`;
    setSaving(true);
    try {
      await api.geofences.create({ name, area: polygonToWkt(draftPoints) });
      showSuccess(`Saved geofence "${name}"`);
      cancelDraw();
      await fetchGeofences();
    } catch (e) {
      showError(e.message || 'Failed to save geofence');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (toDelete == null) return;
    try {
      await api.geofences.remove(toDelete);
      showSuccess('Geofence deleted');
      setSelectedId((id) => (id === toDelete ? null : id));
      await fetchGeofences();
    } catch (e) {
      showError(e.message || 'Failed to delete geofence');
    } finally {
      setToDelete(null);
    }
  };

  const selected = useMemo(
    () => geofences.find((g) => g.id === selectedId) || null,
    [geofences, selectedId],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Geofences"
        description="Click the map to draw a polygon, or select an existing zone to delete."
        actions={
          <>
            {drawing ? (
              <>
                <Button size="sm" variant="outline" onClick={cancelDraw}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveDraft}
                  disabled={saving || draftPoints.length < 3}
                >
                  <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save polygon'}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={startDraw}>
                  <Pencil className="h-4 w-4" /> Draw polygon
                </Button>
                <Link to="/settings/geofences" className="text-sm text-primary underline">
                  Advanced
                </Link>
              </>
            )}
          </>
        }
      />

      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div ref={mapContainerRef} className="h-[560px] w-full" />
          {drawing && (
            <div className="border-t border-border bg-warning/10 px-4 py-2 text-xs text-warning-foreground">
              Drawing mode — tap {draftPoints.length < 3 ? `${3 - draftPoints.length} more` : 'more'} points,
              then Save. Double-click a point on the map to add a vertex.
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {drawing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">New geofence</CardTitle>
                <CardDescription>{draftPoints.length} vertices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Name (e.g. Warehouse)"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
                {draftPoints.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraftPoints((prev) => prev.slice(0, -1))}
                  >
                    Undo last point
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Existing zones</CardTitle>
              <CardDescription>
                {loading ? 'Loading…' : `${geofences.length} geofences`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!loading && geofences.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="No geofences yet"
                    description="Draw a polygon on the map to create your first zone."
                  />
                </div>
              ) : (
                <ul className="max-h-[380px] divide-y divide-border overflow-y-auto">
                  {geofences.map((g) => (
                    <li
                      key={g.id}
                      className={`flex items-center justify-between gap-2 p-3 text-sm ${
                        selectedId === g.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(g.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate font-medium">{g.name}</span>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setToDelete(g.id)}
                        aria-label={`Delete ${g.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {selected && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{selected.name}</CardTitle>
                <CardDescription>Geofence #{selected.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
                  {String(selected.area || '').slice(0, 220)}
                  {selected.area && selected.area.length > 220 ? '…' : ''}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={toDelete != null}
        onOpenChange={(v) => { if (!v) setToDelete(null); }}
        title="Delete geofence?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
