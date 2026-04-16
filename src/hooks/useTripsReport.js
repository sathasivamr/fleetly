import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import { toTrip } from '@/lib/transformers';

/**
 * Loads /reports/trips for the given window and device ids.
 */
export function useTripsReport({ deviceIds, fromIso, toIso, nameByDeviceId }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const namesRef = useRef(nameByDeviceId);
  namesRef.current = nameByDeviceId;

  const key = useMemo(
    () => `${fromIso}|${toIso}|${(deviceIds || []).join(',')}`,
    [fromIso, toIso, deviceIds],
  );

  useEffect(() => {
    if (!fromIso || !toIso || !deviceIds?.length) {
      setTrips([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const raw = await api.reports.trips({
          from: fromIso,
          to: toIso,
          deviceId: deviceIds,
        });
        if (cancelled) return;
        const nm = namesRef.current || {};
        const list = (raw || []).map((t) =>
          toTrip(t, nm[t.deviceId] || `Device ${t.deviceId}`),
        );
        list.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setTrips(list);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e);
        setTrips([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, fromIso, toIso, deviceIds]);

  return { trips, loading, error };
}
