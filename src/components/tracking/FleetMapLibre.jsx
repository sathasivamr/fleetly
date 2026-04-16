import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createCarMarkerElement, updateCarMarkerElement } from './carMarkerSvg';

/** Google Maps–like road map: colored roads & labels (Carto Voyager). */
const STYLE_ROAD = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

/** Satellite imagery (Esri World Imagery) — similar to Google satellite. */
const STYLE_SATELLITE = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        '<a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>',
      maxzoom: 22,
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 22 }],
};

function styleForBasemap(basemap) {
  return basemap === 'satellite' ? STYLE_SATELLITE : STYLE_ROAD;
}

function validCoord(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return false;
  return !(la === 0 && ln === 0);
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Live fleet map: road or satellite basemap + car image markers for every vehicle with coordinates.
 */
export default function FleetMapLibre({
  vehicles = [],
  selectedId = null,
  onSelectVehicle,
  className = '',
  showControls = true,
  showGeolocate = false,
  fitPadding = 48,
  basemap = 'road',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const markersRef = useRef(new Map());
  const initialFitDoneRef = useRef(false);
  const propsRef = useRef({
    vehicles,
    selectedId,
    onSelectVehicle,
    fitPadding,
  });

  propsRef.current = { vehicles, selectedId, onSelectVehicle, fitPadding };

  const syncMarkers = useRef(() => {});

  syncMarkers.current = () => {
    const map = mapRef.current;
    if (!map?.loaded()) return;

    const { vehicles: veh, selectedId: sel, fitPadding: pad } = propsRef.current;
    const list = Array.isArray(veh) ? veh : [];
    const nextIds = new Set();

    for (const v of list) {
      const id = v?.id != null ? String(v.id) : '';
      if (!id || !validCoord(v.lat, v.lng)) continue;
      nextIds.add(id);

      const selected = sel === id;
      const existing = markersRef.current.get(id);

      if (existing) {
        existing.marker.setLngLat([v.lng, v.lat]);
        updateCarMarkerElement(existing.el, v, selected);
        continue;
      }

      const el = createCarMarkerElement({
        vehicle: v,
        selected,
        onClick: () => {
          const { onSelectVehicle, vehicles: vehList } = propsRef.current;
          onSelectVehicle?.(id);
          const map = mapRef.current;
          if (!map?.loaded()) return;
          const latest = (Array.isArray(vehList) ? vehList : []).find((x) => String(x.id) === id);
          if (!latest || !validCoord(latest.lat, latest.lng)) return;
          if (!popupRef.current) {
            popupRef.current = new maplibregl.Popup({
              offset: 32,
              closeButton: true,
              maxWidth: '300px',
            });
          }
          const addrHtml = latest.address
            ? `<p style="margin:6px 0 0;font-size:12px;line-height:1.35;color:#64748b;max-width:260px">${escapeHtml(latest.address)}</p>`
            : '<p style="margin:6px 0 0;font-size:12px;color:#94a3b8">No address from server.</p>';
          popupRef.current
            .setLngLat([latest.lng, latest.lat])
            .setHTML(
              `<div style="padding:2px 4px;min-width:200px"><div style="font-weight:600;font-size:14px">${escapeHtml(latest.name || 'Vehicle')}</div>${addrHtml}</div>`,
            )
            .addTo(map);
        },
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([v.lng, v.lat])
        .addTo(map);
      markersRef.current.set(id, { marker, el });
    }

    for (const [id, { marker }] of markersRef.current) {
      if (!nextIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    const bounds = new maplibregl.LngLatBounds();
    let n = 0;
    for (const v of list) {
      if (!validCoord(v.lat, v.lng)) continue;
      bounds.extend([v.lng, v.lat]);
      n += 1;
    }
    if (n === 0) {
      initialFitDoneRef.current = false;
      return;
    }

    if (!initialFitDoneRef.current) {
      initialFitDoneRef.current = true;
      if (n === 1) {
        const v = list.find((x) => validCoord(x.lat, x.lng));
        map.easeTo({ center: [v.lng, v.lat], zoom: 14, duration: 400 });
      } else {
        map.fitBounds(bounds, { padding: pad, maxZoom: 16, duration: 500 });
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const map = new maplibregl.Map({
      container,
      style: styleForBasemap(basemap),
      center: [0, 20],
      zoom: 1.5,
      attributionControl: true,
    });

    if (showControls) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    }
    if (showGeolocate) {
      map.addControl(
        new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
        'top-right',
      );
    }

    map.on('load', () => {
      mapRef.current = map;
      initialFitDoneRef.current = false;
      syncMarkers.current();
    });

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      popupRef.current?.remove();
      popupRef.current = null;
      for (const { marker } of markersRef.current.values()) {
        marker.remove();
      }
      markersRef.current.clear();
      mapRef.current = null;
      initialFitDoneRef.current = false;
      map.remove();
    };
  }, [showControls, showGeolocate]);

  const appliedBasemapRef = useRef(basemap);
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;
    if (appliedBasemapRef.current === basemap) return;
    appliedBasemapRef.current = basemap;
    map.setStyle(styleForBasemap(basemap));
    map.once('style.load', () => {
      syncMarkers.current();
    });
  }, [basemap]);

  useEffect(() => {
    syncMarkers.current();
  }, [vehicles, selectedId, fitPadding]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', minHeight: 0 }} />;
}
