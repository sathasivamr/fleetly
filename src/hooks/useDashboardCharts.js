import { useState, useEffect, useMemo } from 'react';
import {
  fetchFleetStatusSeries,
  fetchUtilizationSeries,
  fetchFuelVolumeSeries,
} from '@/lib/dashboardAnalytics';

export function useDashboardCharts(deviceIds) {
  const [fleetStatus, setFleetStatus] = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [fuelWeeks, setFuelWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const idsKey = useMemo(() => (deviceIds || []).join(','), [deviceIds]);

  useEffect(() => {
    if (!deviceIds?.length) {
      setFleetStatus([]);
      setUtilization([]);
      setFuelWeeks([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [fs, ut, fw] = await Promise.all([
          fetchFleetStatusSeries(deviceIds),
          fetchUtilizationSeries(deviceIds),
          fetchFuelVolumeSeries(deviceIds),
        ]);
        if (cancelled) return;
        setFleetStatus(fs);
        setUtilization(ut);
        setFuelWeeks(fw);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idsKey, deviceIds]);

  return { fleetStatus, utilization, fuelWeeks, loading, error };
}
