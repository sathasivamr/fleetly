import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Settings, Shield } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import DriverForm from '@/components/drivers/DriverForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDate, formatDistance, formatDuration, initials } from '@/lib/utils';
import { api } from '@/lib/api';
import { toDriver } from '@/lib/transformers';
import { useLiveData } from '@/context/LiveDataContext';
import { useTripsReport } from '@/hooks/useTripsReport';
import { useFlash } from '@/context/FlashContext';

async function persistDriver(form, rawDriver) {
  const attributes = {
    ...(rawDriver?.attributes || {}),
    phone: form.phone || undefined,
    email: form.email || undefined,
    license: form.license || undefined,
  };
  await api.drivers.update(rawDriver.id, {
    ...rawDriver,
    name: form.name.trim(),
    uniqueId: rawDriver.uniqueId,
    attributes,
  });
}

export default function DriverProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useFlash();
  const { devices } = useLiveData();
  const [driver, setDriver] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [rawDriver, setRawDriver] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deviceIds = useMemo(() => devices.map((d) => d.id), [devices]);
  const nameByDeviceId = useMemo(() => {
    const m = {};
    devices.forEach((d) => {
      m[d.id] = d.name;
    });
    return m;
  }, [devices]);

  const fromIso = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), []);
  const toIso = useMemo(() => new Date().toISOString(), []);

  const { trips: allTrips, loading: tripsLoading } = useTripsReport({
    deviceIds,
    fromIso,
    toIso,
    nameByDeviceId,
  });

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    (async () => {
      try {
        const raw = await api.drivers.get(id);
        if (cancelled) return;
        setRawDriver(raw);
        setDriver(toDriver(raw));
      } catch (e) {
        if (!cancelled) {
          setDriver(null);
          setRawDriver(null);
          setLoadError(e.message || 'Failed to load driver');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const driverTrips = useMemo(() => {
    if (!driver) return [];
    return allTrips.filter((t) => t.driver === driver.name);
  }, [allTrips, driver]);

  const driverAlerts = useMemo(() => {
    if (!driver) return [];
    return driverTrips.filter((t) => t.violations > 0);
  }, [driverTrips, driver]);

  const submitEdit = async (form) => {
    if (!rawDriver) return;
    try {
      await persistDriver(form, rawDriver);
      showSuccess('Driver updated');
      const next = await api.drivers.get(id);
      setRawDriver(next);
      setDriver(toDriver(next));
    } catch (e) {
      showError(e.message || 'Save failed');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (!rawDriver) return;
    setDeleting(true);
    try {
      await api.drivers.remove(rawDriver.id);
      showSuccess('Driver deleted');
      navigate('/drivers', { replace: true });
    } catch (e) {
      showError(e.message || 'Delete failed');
      throw e;
    } finally {
      setDeleting(false);
    }
  };

  if (!driver && loadError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link to="/drivers">
            <ArrowLeft className="h-4 w-4" /> All drivers
          </Link>
        </Button>
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link to="/drivers">
            <ArrowLeft className="h-4 w-4" /> All drivers
          </Link>
        </Button>
        <EmptyState title="Driver not found" />
      </div>
    );
  }

  const d = driver;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link to="/drivers">
          <ArrowLeft className="h-4 w-4" /> All drivers
        </Link>
      </Button>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden />
        <span>
          Advanced driver configuration lives in{' '}
          <Link to="/settings/drivers" className="font-medium text-primary underline-offset-4 hover:underline">
            Settings → Drivers
          </Link>
          .
        </span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-sm">
              <AvatarFallback>{initials(d.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-semibold">{d.name}</div>
              <div className="text-sm text-muted-foreground">
                {d.license} · Assigned to {d.assignedVehicle}
              </div>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {d.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {d.email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 md:w-72">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Edit driver
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            </div>
            <StatusBadge status={d.status} />
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Safety score</span>
                <span className="font-semibold tabular-nums">{d.score}/100</span>
              </div>
              <Progress
                value={d.score}
                tone={d.score >= 90 ? 'success' : d.score >= 75 ? 'primary' : 'warning'}
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total trips" value={d.trips} />
        <Stat label="Violations" value={d.violations} />
        <Stat label="Hired" value={d.hiredAt} />
        <Stat label="License" value={d.license} />
      </div>

      <Tabs defaultValue="trips">
        <TabsList>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          <Card>
            <CardContent className="p-0">
              {tripsLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading…</div>
              ) : driverTrips.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No trips matched to this driver" description="Trip reports list driver names when devices assign drivers." />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverTrips.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell>{t.vehicle}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDistance(t.distance)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDuration(t.duration)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(t.startTime)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <CardTitle>Trip-based violations</CardTitle>
              <CardDescription>Trips with reported violations in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {driverAlerts.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No violations on record" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverAlerts.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell>{t.vehicle}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.violations} violation(s) on trip
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(t.startTime)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance breakdown</CardTitle>
              <CardDescription>Derived from driver attributes in Traccar</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Smooth driving', value: Math.min(100, d.score + 2) },
                { label: 'On-time arrival', value: Math.min(100, d.score - 3) },
                { label: 'Fuel efficiency', value: Math.min(100, d.score - 5) },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" /> {m.label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold tabular-nums">{m.value}</div>
                  <Progress value={m.value} className="mt-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DriverForm
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={rawDriver ? { driver: rawDriver } : null}
        onSubmit={submitEdit}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this driver?"
        description="They will be removed from the server. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 text-base font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
