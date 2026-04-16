import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_ROAD = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const STOP_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
];

function validCoord(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return false;
  return !(la === 0 && ln === 0);
}

export default function RouteMap({ stops = [], className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_ROAD,
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => map.remove();
  }, []);

  // Update markers and line when stops change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validStops = stops.filter((s) => validCoord(s.lat, s.lng));

    if (validStops.length === 0) return;

    // Add markers
    validStops.forEach((stop, idx) => {
      const el = document.createElement('div');
      el.className = 'route-stop-marker';
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${STOP_COLORS[idx % STOP_COLORS.length]};
        color: white; display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 700; border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer;
      `;
      el.textContent = String(idx + 1);

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        `<div style="padding:4px 8px">
          <div style="font-weight:600">Stop ${idx + 1}</div>
          <div style="font-size:12px;color:#666">${stop.address || 'No address'}</div>
          ${stop.estimatedArrival ? `<div style="font-size:11px;color:#999">ETA: ${stop.estimatedArrival}</div>` : ''}
          ${stop.notes ? `<div style="font-size:11px;color:#999">${stop.notes}</div>` : ''}
        </div>`,
      );

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(stop.lng), Number(stop.lat)])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Draw route line
    const coords = validStops.map((s) => [Number(s.lng), Number(s.lat)]);

    const waitForStyle = () => {
      if (map.getSource('route-line')) {
        map.getSource('route-line').setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
        });
      } else {
        map.addSource('route-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
          },
        });
        map.addLayer({
          id: 'route-line-layer',
          type: 'line',
          source: 'route-line',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3,
            'line-dasharray': [2, 2],
          },
        });
      }

      // Fit bounds
      if (coords.length >= 2) {
        const bounds = new maplibregl.LngLatBounds();
        coords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      } else if (coords.length === 1) {
        map.flyTo({ center: coords[0], zoom: 12 });
      }
    };

    if (map.isStyleLoaded()) {
      waitForStyle();
    } else {
      map.once('style.load', waitForStyle);
    }
  }, [stops]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 350 }}
    />
  );
}
