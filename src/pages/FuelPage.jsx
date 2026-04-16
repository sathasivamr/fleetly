import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import FuelCostChart from '@/components/charts/FuelCostChart';
import { useLiveData } from '@/context/LiveDataContext';
import { useSession } from '@/context/SessionContext';
import { api } from '@/lib/api';
import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { downloadCsv } from '@/lib/csv';

export default function FuelPage() {
  const { user } = useSession();
  const { devices } = useLiveData();
  const deviceIds = useMemo(() => devices.map((d) => d.id), [devices]);
  const nameByDeviceId = useMemo(() => {
    const m = {};
    devices.forEach((d) => {
      m[d.id] = d.name;
    });
    return m;
  }, [devices]);

  const { fuelWeeks, loading: chartLoading } = useDashboardCharts(deviceIds);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!user || !deviceIds.length) {
      setRows([]);
      setLoadError(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 14);
    (async () => {
      try {
        const raw = await api.reports.summary({
          from: start.toISOString(),
          to: end.toISOString(),
          deviceId: deviceIds,
        });
        if (cancelled) return;
        setRows(raw || []);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setLoadError(e.message || 'Failed to load summary');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, deviceIds]);

  const totalLiters = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.spentFuel) || 0), 0),
    [rows],
  );
  const totalKm = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.distance) || 0), 0) / 1000,
    [rows],
  );

  return (
    <div className="space-y-5">
      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}
      <PageHeader
        title="Fuel"
        description="Spent fuel and distance from Traccar summary reports (last 14 days)"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv(
                `fuel-14d-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  {
                    key: 'vehicle',
                    label: 'Vehicle',
                    format: (r) => nameByDeviceId[r.deviceId] || r.deviceName || `Device ${r.deviceId}`,
                  },
                  {
                    key: 'distance',
                    label: 'Distance (km)',
                    format: (r) => (r.distance != null ? (Number(r.distance) / 1000).toFixed(2) : ''),
                  },
                  {
                    key: 'spentFuel',
                    label: 'Spent fuel (L)',
                    format: (r) => (r.spentFuel != null ? (Math.round(Number(r.spentFuel) * 10) / 10) : ''),
                  },
                  {
                    key: 'averageSpeed',
                    label: 'Avg speed (kn)',
                    format: (r) => (r.averageSpeed != null ? Math.round(Number(r.averageSpeed)) : ''),
                  },
                ],
                rows,
              )
            }
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium uppercase text-muted-foreground">Total distance</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{totalKm.toFixed(1)} km</div>
            <div className="text-xs text-muted-foreground">Last 14 days · fleet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Spent fuel (reported)
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {loading ? '…' : `${Math.round(totalLiters * 10) / 10} L`}
            </div>
            <div className="text-xs text-muted-foreground">Per-device summary</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium uppercase text-muted-foreground">Cost</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">—</div>
            <div className="text-xs text-muted-foreground">Add fuel price in attributes to estimate</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volume trend</CardTitle>
          <CardDescription>Weekly spent fuel (liters) · {chartLoading ? 'loading…' : 'from reports'}</CardDescription>
        </CardHeader>
        <CardContent>
          <FuelCostChart data={fuelWeeks} valueLabel="Fuel (L)" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By vehicle</CardTitle>
          <CardDescription>Summary report rows · last 14 days</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Distance (km)</TableHead>
                  <TableHead className="text-right">Spent fuel (L)</TableHead>
                  <TableHead className="text-right">Avg speed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.deviceId}>
                    <TableCell className="font-medium">
                      {nameByDeviceId[r.deviceId] || r.deviceName || `Device ${r.deviceId}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.distance != null ? (Number(r.distance) / 1000).toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.spentFuel != null ? Math.round(Number(r.spentFuel) * 10) / 10 : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.averageSpeed != null ? `${Math.round(Number(r.averageSpeed))} kn` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
