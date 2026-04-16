import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Download, Filter, Search } from 'lucide-react';
import { downloadCsv } from '@/lib/csv';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDate, formatDistance, formatDuration } from '@/lib/utils';
import { useLiveData } from '@/context/LiveDataContext';
import { useTripsReport } from '@/hooks/useTripsReport';

export default function TripsPage() {
  const { devices } = useLiveData();
  const deviceIds = useMemo(() => devices.map((d) => d.id), [devices]);
  const nameByDeviceId = useMemo(() => {
    const m = {};
    devices.forEach((d) => {
      m[d.id] = d.name;
    });
    return m;
  }, [devices]);

  const [rangeDays, setRangeDays] = useState(7);
  const fromIso = useMemo(
    () => new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString(),
    [rangeDays],
  );
  const toIso = useMemo(() => new Date().toISOString(), [rangeDays]);

  const { trips, loading } = useTripsReport({
    deviceIds,
    fromIso,
    toIso,
    nameByDeviceId,
  });

  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return trips;
    return trips.filter(
      (t) =>
        String(t.id).toLowerCase().includes(needle) ||
        String(t.vehicle).toLowerCase().includes(needle) ||
        String(t.driver).toLowerCase().includes(needle),
    );
  }, [trips, q]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trips"
        description="Every movement across the fleet — filter, inspect, and export."
        actions={
          <>
            <label className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <select
                value={rangeDays}
                onChange={(e) => setRangeDays(Number(e.target.value))}
                className="bg-transparent text-foreground outline-none"
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
            <Button
              variant="outline"
              size="sm"
              disabled={!filtered.length}
              onClick={() =>
                downloadCsv(
                  `trips-${rangeDays}d-${new Date().toISOString().slice(0, 10)}.csv`,
                  [
                    { key: 'id', label: 'Trip ID' },
                    { key: 'vehicle', label: 'Vehicle' },
                    { key: 'driver', label: 'Driver' },
                    { key: 'from', label: 'From' },
                    { key: 'to', label: 'To' },
                    { key: 'startTime', label: 'Started' },
                    { key: 'endTime', label: 'Ended' },
                    { key: 'distance', label: 'Distance (km)', format: (r) => r.distance.toFixed(2) },
                    { key: 'duration', label: 'Duration (min)', format: (r) => r.duration.toFixed(1) },
                    { key: 'avgSpeed', label: 'Avg speed (mph)' },
                    { key: 'maxSpeed', label: 'Max speed (mph)' },
                    { key: 'fuelUsed', label: 'Fuel (L)' },
                  ],
                  filtered,
                )
              }
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>All trips</CardTitle>
            <CardDescription>
              {loading ? 'Loading…' : `${filtered.length} results`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="h-9 w-60 pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!loading && filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No trips in the last 7 days" />
            </div>
          ) : loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading trips…</div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Avg / Max</TableHead>
                      <TableHead>Violations</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell>
                          <Link
                            to={`/vehicles/${t.deviceId}`}
                            className="font-medium hover:text-primary"
                          >
                            {t.vehicle}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{t.driver}</TableCell>
                        <TableCell className="max-w-[260px]">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="truncate">{t.from}</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span className="truncate">{t.to}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDistance(t.distance)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDuration(t.duration)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                          {t.avgSpeed} / {t.maxSpeed} mph
                        </TableCell>
                        <TableCell>
                          {t.violations > 0 ? (
                            <StatusBadge status="high" label={`${t.violations}`} />
                          ) : (
                            <span className="text-xs text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(t.startTime)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="divide-y divide-border md:hidden">
                {filtered.map((t) => (
                  <li key={t.id} className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">{t.id}</div>
                        <div className="font-semibold">{t.vehicle}</div>
                      </div>
                      {t.violations > 0 ? (
                        <StatusBadge status="high" label={`${t.violations} viol.`} />
                      ) : (
                        <StatusBadge status="completed" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">{t.from}</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="truncate">{t.to}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{formatDistance(t.distance)}</span>
                      <span>{formatDuration(t.duration)}</span>
                      <span>{t.driver}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
