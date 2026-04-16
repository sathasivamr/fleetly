import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Activity,
  Clock,
  BellRing,
  Wrench,
  ExternalLink,
  Gauge,
  Fuel,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import KpiCard from '@/components/dashboard/KpiCard';
import MiniMap from '@/components/dashboard/MiniMap';
import RecentTripsTable from '@/components/dashboard/RecentTripsTable';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import FleetStatusChart from '@/components/charts/FleetStatusChart';
import UtilizationChart from '@/components/charts/UtilizationChart';
import FuelCostChart from '@/components/charts/FuelCostChart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLiveData } from '@/context/LiveDataContext';
import { useSession } from '@/context/SessionContext';
import { api } from '@/lib/api';
import { computeDashboardKpis } from '@/lib/dashboardAnalytics';
import { toMaintenance } from '@/lib/transformers';
import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { useTripsReport } from '@/hooks/useTripsReport';

export default function DashboardPage() {
  const { user } = useSession();
  const { vehicles, devices, alerts, connected } = useLiveData();
  const deviceIds = useMemo(() => devices.map((d) => d.id), [devices]);
  const nameByDeviceId = useMemo(() => {
    const m = {};
    devices.forEach((d) => {
      m[d.id] = d.name;
    });
    return m;
  }, [devices]);

  const { fleetStatus, utilization, fuelWeeks, loading: chartsLoading } =
    useDashboardCharts(deviceIds);

  const from24h = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), []);
  const toNow = useMemo(() => new Date().toISOString(), []);
  const { trips: recentTrips, loading: tripsLoading } = useTripsReport({
    deviceIds,
    fromIso: from24h,
    toIso: toNow,
    nameByDeviceId,
  });

  const [maintRows, setMaintRows] = useState([]);
  const [fuelMonthLiters, setFuelMonthLiters] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const raw = await api.maintenance.list();
        if (cancelled) return;
        setMaintRows((raw || []).map(toMaintenance));
      } catch {
        if (!cancelled) setMaintRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !deviceIds.length) {
      setFuelMonthLiters(null);
      return undefined;
    }
    let cancelled = false;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    (async () => {
      try {
        const rows = await api.reports.summary({
          from: start.toISOString(),
          to: end.toISOString(),
          deviceId: deviceIds,
        });
        if (cancelled) return;
        const liters = (rows || []).reduce((s, r) => s + (Number(r.spentFuel) || 0), 0);
        setFuelMonthLiters(Math.round(liters * 10) / 10);
      } catch {
        if (!cancelled) setFuelMonthLiters(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, deviceIds]);

  const kpis = useMemo(
    () => computeDashboardKpis(vehicles, alerts, maintRows),
    [vehicles, alerts, maintRows],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet overview"
        description="Operations at a glance — use the cards below to drill into trips, alerts, and live map."
        live={connected}
        liveLabel={connected ? 'Live socket' : 'Reconnecting…'}
        actions={
          <Button size="sm" asChild>
            <Link to="/tracking">Open live map</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total vehicles" value={kpis.totalVehicles} icon={Truck} />
        <KpiCard
          label="Active vehicles"
          value={kpis.activeVehicles}
          icon={Activity}
          tone="success"
        />
        <KpiCard label="Idle vehicles" value={kpis.idleVehicles} icon={Clock} tone="warning" />
        <KpiCard
          label="Alerts today"
          value={kpis.alertsToday}
          icon={BellRing}
          tone="destructive"
        />
        <KpiCard
          label="Maintenance due"
          value={kpis.maintenanceDue}
          icon={Wrench}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Live fleet map</CardTitle>
              <CardDescription>Real-time positions and status</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tracking">
                Open <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <MiniMap vehicles={vehicles} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Open alerts</CardTitle>
            <CardDescription>Needs attention</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertsPanel alerts={alerts} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Fleet status</CardTitle>
            <CardDescription>
              Distance-based activity from summary reports · {chartsLoading ? 'loading…' : 'last 7 days'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FleetStatusChart data={fleetStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Utilization</CardTitle>
              <CardDescription>From reported distance (heuristic)</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-2xl font-semibold text-foreground">
              <Gauge className="h-4 w-4 text-primary" />
              {kpis.avgUtilization}%
            </div>
          </CardHeader>
          <CardContent>
            <UtilizationChart data={utilization} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Fuel volume</CardTitle>
              <CardDescription>Weekly spent fuel (liters)</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-2xl font-semibold text-foreground">
              <Fuel className="h-4 w-4 text-primary" />
              {fuelMonthLiters != null ? `${fuelMonthLiters} L` : '—'}
            </div>
          </CardHeader>
          <CardContent>
            <FuelCostChart data={fuelWeeks} valueLabel="Fuel (L)" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Recent trips</CardTitle>
            <CardDescription>Last 24 hours across the fleet</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/trips">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <RecentTripsTable trips={recentTrips.slice(0, 12)} loading={tripsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
