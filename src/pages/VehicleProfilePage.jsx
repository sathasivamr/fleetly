import { useMemo, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Fuel, Navigation, Wrench } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import VehicleForm from '@/components/vehicles/VehicleForm';
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
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency, formatDate, formatDistance, formatDuration } from '@/lib/utils';
import { useLiveData } from '@/context/LiveDataContext';
import { useFlash } from '@/context/FlashContext';
import { api } from '@/lib/api';
import { toMaintenance } from '@/lib/transformers';
import { useTripsReport } from '@/hooks/useTripsReport';

export default function VehicleProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVehicle, refresh } = useLiveData();
  const { showError, showSuccess } = useFlash();
  const v = getVehicle(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deviceIds = useMemo(() => (v ? [v.id] : []), [v]);
  const nameByDeviceId = useMemo(() => (v ? { [v.id]: v.name } : {}), [v]);

  const fromIso = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), []);
  const toIso = useMemo(() => new Date().toISOString(), []);

  const { trips: vehicleTrips, loading: tripsLoading } = useTripsReport({
    deviceIds,
    fromIso,
    toIso,
    nameByDeviceId,
  });

  const [maintAll, setMaintAll] = useState([]);
  const [fuelSummary, setFuelSummary] = useState(null);
  const [maintLoadError, setMaintLoadError] = useState(null);
  const [fuelLoadError, setFuelLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setMaintLoadError(null);
    (async () => {
      try {
        const raw = await api.maintenance.list();
        if (cancelled) return;
        setMaintAll((raw || []).map(toMaintenance));
      } catch (e) {
        if (!cancelled) {
          setMaintAll([]);
          setMaintLoadError(e.message || 'Failed to load maintenance');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!v) {
      setFuelSummary(null);
      setFuelLoadError(null);
      return undefined;
    }
    let cancelled = false;
    setFuelLoadError(null);
    const start = new Date();
    start.setDate(start.getDate() - 90);
    (async () => {
      try {
        const rows = await api.reports.summary({
          from: start.toISOString(),
          to: new Date().toISOString(),
          deviceId: [v.id],
        });
        if (cancelled) return;
        const row = (rows || [])[0];
        setFuelSummary(row || null);
      } catch (e) {
        if (!cancelled) {
          setFuelSummary(null);
          setFuelLoadError(e.message || 'Failed to load fuel summary');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [v]);

  const vehicleWOs = useMemo(
    () => (v ? maintAll.filter((m) => m.vehicle === v.name) : []),
    [maintAll, v],
  );

  const persistDevice = async (form, deviceId) => {
    const gid = form.groupId?.trim();
    const groupIdParsed = gid ? Number(gid) : null;
    const current = await api.devices.get(deviceId);
    await api.devices.update(deviceId, {
      ...current,
      name: form.name.trim(),
      uniqueId: current.uniqueId,
      model: form.model || '',
      groupId: Number.isFinite(groupIdParsed) ? groupIdParsed : current.groupId ?? null,
      attributes: {
        ...(current.attributes || {}),
        plate: form.plate,
        vin: form.vin,
      },
    });
  };

  const submitEdit = async (form) => {
    if (!v?._raw?.device?.id) {
      showError('Missing device data');
      throw new Error('Missing device');
    }
    try {
      await persistDevice(form, v._raw.device.id);
      showSuccess('Device updated');
      await refresh();
    } catch (e) {
      showError(e.message || 'Save failed');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (!v?._raw?.device?.id) return;
    setDeleting(true);
    try {
      await api.devices.remove(v._raw.device.id);
      showSuccess('Device deleted');
      await refresh();
      navigate('/vehicles', { replace: true });
    } catch (e) {
      showError(e.message || 'Delete failed');
      throw e;
    } finally {
      setDeleting(false);
    }
  };

  if (!v) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link to="/vehicles">
            <ArrowLeft className="h-4 w-4" /> All vehicles
          </Link>
        </Button>
        <EmptyState title="Vehicle not found" description="Check the link or pick a device from the list." />
      </div>
    );
  }

  const latOk = v.lat != null && v.lng != null;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link to="/vehicles">
          <ArrowLeft className="h-4 w-4" /> All vehicles
        </Link>
      </Button>

      <PageHeader
        title={`${v.name} · ${v.model}`}
        description={`${v.plate} · ${v.group}`}
        actions={
          <>
            <StatusBadge status={v.status} />
            <Button size="sm" variant="outline" type="button" onClick={() => setEditOpen(true)}>
              Edit device
            </Button>
            <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            <Button size="sm" asChild>
              <Link to="/tracking">Live track</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Driver" value={v.driver} />
        <Stat
          label="Odometer"
          value={v.odometer != null ? `${Number(v.odometer).toLocaleString()} mi` : '—'}
        />
        <Stat label="Fuel" value={typeof v.fuel === 'number' ? `${v.fuel}%` : '—'} />
        <Stat label="Last update" value={formatDate(v.lastUpdate)} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="fuel">Fuel history</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Telemetry</CardTitle>
                <CardDescription>Most recent readings</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Kv label="Speed" value={`${v.speed} mph`} />
                <Kv label="Ignition" value={v.ignition ? 'On' : 'Off'} />
                <Kv
                  label="Location"
                  value={latOk ? `${Number(v.lat).toFixed(4)}, ${Number(v.lng).toFixed(4)}` : '—'}
                />
                <Kv label="VIN" value={v.vin} mono />
                <Kv label="Group" value={v.group} />
                <Kv label="Course" value={`${v.course ?? 0}°`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Common operations</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/tracking">
                    <Navigation className="h-4 w-4" /> Live track
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/maintenance">
                    <Wrench className="h-4 w-4" /> Maintenance
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/fuel">
                    <Fuel className="h-4 w-4" /> Fuel report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trips">
          <Card>
            <CardContent className="p-0">
              {tripsLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading trips…</div>
              ) : vehicleTrips.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No trips for this vehicle in the last 30 days" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleTrips.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.from} → {t.to}
                        </TableCell>
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

        <TabsContent value="maintenance">
          {maintLoadError && (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {maintLoadError}
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              {vehicleWOs.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No maintenance rows from Traccar" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleWOs.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-mono text-xs">{w.id}</TableCell>
                        <TableCell>{w.title}</TableCell>
                        <TableCell>
                          <StatusBadge status={w.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{w.dueDate}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {w.cost ? formatCurrency(w.cost) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          {fuelLoadError && (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {fuelLoadError}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Reported fuel (Traccar summary)</CardTitle>
              <CardDescription>Last 90 days · spent fuel from device reports</CardDescription>
            </CardHeader>
            <CardContent>
              {!fuelSummary ? (
                <EmptyState title="No fuel data" description="Spent fuel appears when devices report it." />
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  <Kv
                    label="Spent fuel"
                    value={
                      fuelSummary.spentFuel != null
                        ? `${Math.round(Number(fuelSummary.spentFuel) * 10) / 10} L`
                        : '—'
                    }
                  />
                  <Kv
                    label="Distance"
                    value={
                      fuelSummary.distance != null
                        ? `${(Number(fuelSummary.distance) / 1000).toFixed(1)} km`
                        : '—'
                    }
                  />
                  <Kv label="Engine hours" value={fuelSummary.engineHours != null ? String(fuelSummary.engineHours) : '—'} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VehicleForm
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={v._raw?.device ? { device: v._raw.device } : null}
        onSubmit={submitEdit}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this device?"
        description="It will be removed from the server. This cannot be undone."
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
        <div className="mt-1 truncate text-base font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Kv({ label, value, mono }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-[10px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 truncate text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
