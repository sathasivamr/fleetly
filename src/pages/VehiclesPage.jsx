import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Pencil, Plus, Search, Settings, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
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
import { Progress } from '@/components/ui/progress';
import StatusBadge from '@/components/common/StatusBadge';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { useLiveData } from '@/context/LiveDataContext';
import { useFlash } from '@/context/FlashContext';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { downloadCsv } from '@/lib/csv';

export default function VehiclesPage() {
  const { vehicles, refresh, error: liveError } = useLiveData();
  const { showError, showSuccess } = useFlash();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [q, setQ] = useState('');
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return vehicles;
    return vehicles.filter(
      (v) =>
        v.name.toLowerCase().includes(needle) ||
        String(v.plate).toLowerCase().includes(needle) ||
        String(v.driver).toLowerCase().includes(needle),
    );
  }, [vehicles, q]);

  const persistDevice = async (form, deviceId) => {
    const gid = form.groupId?.trim();
    const groupIdParsed = gid ? Number(gid) : null;
    if (deviceId) {
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
    } else {
      const uid =
        form.uniqueId.trim() || form.plate.trim() || `device-${Date.now()}`;
      await api.devices.create({
        name: form.name.trim(),
        uniqueId: uid,
        model: form.model || '',
        ...(Number.isFinite(groupIdParsed) ? { groupId: groupIdParsed } : {}),
        attributes: {
          plate: form.plate,
          vin: form.vin,
        },
      });
    }
  };

  const submitVehicle = async (form) => {
    try {
      await persistDevice(form, editing?._raw?.device?.id ?? null);
      showSuccess(editing ? 'Device updated' : 'Device created');
      await refresh();
      setEditing(null);
    } catch (err) {
      showError(err.message || 'Save failed');
      throw err;
    }
  };

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (v) => {
    if (!v._raw?.device) {
      showError('Cannot edit: missing device data. Refresh the page.');
      return;
    }
    setEditing(v);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api.devices.remove(deleteId);
      showSuccess('Device deleted');
      await refresh();
      setDeleteId(null);
    } catch (err) {
      showError(err.message || 'Delete failed');
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const exportDevices = () => {
    downloadCsv(
      `devices-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: 'name', label: 'Name' },
        { key: 'plate', label: 'Plate' },
        { key: 'model', label: 'Model' },
        { key: 'status', label: 'Status' },
        { key: 'driver', label: 'Driver' },
        { key: 'group', label: 'Group' },
        { key: 'speed', label: 'Speed (mph)' },
        { key: 'odometer', label: 'Odometer (mi)' },
        { key: 'lat', label: 'Latitude' },
        { key: 'lng', label: 'Longitude' },
        { key: 'address', label: 'Address' },
        { key: 'lastUpdate', label: 'Last update' },
      ],
      vehicles,
    );
    showSuccess('CSV downloaded');
  };

  return (
    <div className="space-y-5">
      {liveError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {liveError.message || 'Failed to load devices'}
        </div>
      )}

      {!liveError && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <Settings className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
          <p>
            <span className="font-medium text-foreground">Advanced device records:</span>{' '}
            <Link
              to="/settings/devices"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Settings → Devices
            </Link>{' '}
            for bulk identifiers and server-side fields. This list is optimized for live operations.
          </p>
        </div>
      )}

      <PageHeader
        title="Devices"
        description={`${vehicles.length} devices (vehicles) from your Traccar account`}
        actions={
          <>
            <Button variant="outline" size="sm" type="button" onClick={exportDevices}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add vehicle
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Fleet directory</CardTitle>
            <CardDescription>Everything you own, assigned, or leased</CardDescription>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search vehicles…"
              className="h-9 w-64 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead>Last update</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="font-semibold">{v.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.model} · {v.plate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.driver}</TableCell>
                    <TableCell className="text-muted-foreground">{v.group}</TableCell>
                    <TableCell className="w-32">
                      {typeof v.fuel === 'number' ? (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={v.fuel}
                            tone={v.fuel < 20 ? 'destructive' : v.fuel < 40 ? 'warning' : 'success'}
                            className="w-16"
                          />
                          <span className="text-xs tabular-nums">{v.fuel}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.odometer != null ? `${Number(v.odometer).toLocaleString()} mi` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(v.lastUpdate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" type="button" asChild>
                          <Link to={`/vehicles/${v.id}`}>Open</Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          type="button"
                          onClick={() => openEdit(v)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          type="button"
                          onClick={() => {
                            setDeleteId(v.id);
                            setDeleteName(v.name);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {filtered.map((v) => (
              <li key={v.id} className="p-4">
                <div className="flex flex-col gap-2">
                  <Link to={`/vehicles/${v.id}`} className="block space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{v.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {v.model} · {v.plate}
                        </div>
                      </div>
                      <StatusBadge status={v.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.driver} · {v.group}
                    </div>
                    {typeof v.fuel === 'number' ? (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={v.fuel}
                          tone={v.fuel < 20 ? 'destructive' : v.fuel < 40 ? 'warning' : 'success'}
                          className="flex-1"
                        />
                        <span className="text-xs tabular-nums">{v.fuel}%</span>
                      </div>
                    ) : null}
                  </Link>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" type="button" onClick={() => openEdit(v)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      type="button"
                      onClick={() => {
                        setDeleteId(v.id);
                        setDeleteName(v.name);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <VehicleForm
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing?._raw?.device ? { device: editing._raw.device } : null}
        onSubmit={submitVehicle}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete device?"
        description={
          deleteName
            ? `This will remove “${deleteName}” from the server. This cannot be undone.`
            : 'This cannot be undone.'
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
