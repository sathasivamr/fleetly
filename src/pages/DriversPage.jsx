import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Pencil, Phone, Plus, Trash2, Settings } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import DriverForm from '@/components/drivers/DriverForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/common/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { initials } from '@/lib/utils';
import { api } from '@/lib/api';
import { toDriver } from '@/lib/transformers';
import { useSession } from '@/context/SessionContext';
import { useFlash } from '@/context/FlashContext';

function scoreTone(score) {
  if (score >= 90) return 'success';
  if (score >= 80) return 'primary';
  if (score >= 70) return 'warning';
  return 'destructive';
}

async function persistDriver(form, rawDriver) {
  const attributes = {
    ...(rawDriver?.attributes || {}),
    phone: form.phone || undefined,
    email: form.email || undefined,
    license: form.license || undefined,
  };
  if (rawDriver) {
    await api.drivers.update(rawDriver.id, {
      ...rawDriver,
      name: form.name.trim(),
      uniqueId: rawDriver.uniqueId,
      attributes,
    });
  } else {
    await api.drivers.create({
      name: form.name.trim(),
      uniqueId: form.uniqueId.trim(),
      attributes,
    });
  }
}

export default function DriversPage() {
  const { user } = useSession();
  const { showError, showSuccess } = useFlash();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    try {
      const raw = await api.drivers.list();
      setDrivers((raw || []).map(toDriver));
    } catch (e) {
      setLoadError(e.message || 'Failed to load drivers');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }
    reload();
    return undefined;
  }, [user]);

  const submitDriver = async (form) => {
    try {
      await persistDriver(form, editing?._raw ?? null);
      showSuccess(editing ? 'Driver updated' : 'Driver created');
      await reload();
      setEditing(null);
    } catch (e) {
      showError(e.message || 'Save failed');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api.drivers.remove(deleteId);
      showSuccess('Driver deleted');
      await reload();
      setDeleteId(null);
    } catch (e) {
      showError(e.message || 'Delete failed');
      throw e;
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {!loadError && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <Settings className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
          <p>
            <span className="font-medium text-foreground">Traccar settings:</span> For bulk driver records and
            identifiers tied to the server, use{' '}
            <Link
              to="/settings/drivers"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Settings → Drivers
            </Link>
            . This page is for day-to-day driver management in Fleetly.
          </p>
        </div>
      )}

      <PageHeader
        title="Drivers"
        description={
          loading ? 'Loading…' : `${drivers.length} drivers from your Traccar server`
        }
        actions={
          <Button size="sm" type="button" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add driver
          </Button>
        }
      />

      {!loading && drivers.length === 0 && !loadError ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No drivers yet — add a driver with the button above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {drivers.map((d) => (
            <Card key={d.id} className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <Link
                  to={`/drivers/${d.id}`}
                  className="group block"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback>{initials(d.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary">
                          {d.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{d.license}</div>
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="h-3.5 w-3.5" /> {d.phone}
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5" /> {d.email}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Safety score</span>
                      <span className="font-semibold tabular-nums">{d.score}</span>
                    </div>
                    <Progress value={d.score} tone={scoreTone(d.score)} className="mt-1.5" />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">{d.assignedVehicle}</span>
                    <span className="text-muted-foreground">
                      {d.trips} trips · {d.violations} viol.
                    </span>
                  </div>
                </Link>

                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(d);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteId(d.id);
                      setDeleteName(d.name);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DriverForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing?._raw ? { driver: editing._raw } : null}
        onSubmit={submitDriver}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete driver?"
        description={deleteName ? `Remove “${deleteName}” from the server?` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
