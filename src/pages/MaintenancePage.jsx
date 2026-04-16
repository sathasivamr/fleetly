import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2, Wrench, ClipboardCheck, Clock, Settings } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import MaintenanceFormDialog from '@/components/maintenance/MaintenanceFormDialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { formatMaintenancePeriod, formatMaintenanceStart } from '@/lib/maintenanceFormat';
import { toMaintenance } from '@/lib/transformers';
import { useSession } from '@/context/SessionContext';
import { useFlash } from '@/context/FlashContext';

const COLUMNS = [
  { id: 'open', title: 'Open', tone: 'destructive' },
  { id: 'scheduled', title: 'Scheduled', tone: 'primary' },
  { id: 'in-progress', title: 'In progress', tone: 'warning' },
  { id: 'completed', title: 'Completed', tone: 'success' },
];

export default function MaintenancePage() {
  const { user } = useSession();
  const { showError, showSuccess } = useFlash();
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRaw, setEditingRaw] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    try {
      const raw = await api.maintenance.list();
      setRawItems(raw || []);
    } catch (e) {
      setLoadError(e.message || 'Failed to load maintenance');
      setRawItems([]);
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

  const items = useMemo(() => (rawItems || []).map(toMaintenance), [rawItems]);

  const byRawId = useMemo(() => {
    const m = {};
    rawItems.forEach((r) => {
      m[r.id] = r;
    });
    return m;
  }, [rawItems]);

  const grouped = useMemo(() => {
    const out = { open: [], scheduled: [], 'in-progress': [], completed: [] };
    items.forEach((i) => {
      if (out[i.status]) out[i.status].push(i);
      else out.scheduled.push(i);
    });
    return out;
  }, [items]);

  const openCount = grouped.open.length + grouped['in-progress'].length;
  const scheduledCount = grouped.scheduled.length;
  const completedCost = items
    .filter((i) => i.status === 'completed')
    .reduce((sum, i) => sum + (i.cost || 0), 0);

  const submitMaintenance = async (payload) => {
    try {
      if (editingRaw) {
        await api.maintenance.update(editingRaw.id, {
          ...editingRaw,
          ...payload,
        });
        showSuccess('Maintenance updated');
      } else {
        await api.maintenance.create(payload);
        showSuccess('Maintenance created');
      }
      setEditingRaw(null);
      await reload();
    } catch (e) {
      showError(e.message || 'Save failed');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api.maintenance.remove(deleteId);
      showSuccess('Maintenance deleted');
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
            <span className="font-medium text-foreground">Traccar settings:</span> Maintenance intervals and
            templates can be refined under{' '}
            <Link
              to="/settings/maintenance"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Settings → Maintenance
            </Link>
            . This board tracks open work and schedules.
          </p>
        </div>
      )}

      <PageHeader
        title="Maintenance"
        description="Service reminders from Traccar maintenance records"
        actions={
          <Button
            size="sm"
            type="button"
            onClick={() => {
              setEditingRaw(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New work order
          </Button>
        }
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">Active</div>
                  <div className="text-2xl font-semibold">{openCount}</div>
                  <div className="text-xs text-muted-foreground">Open + in progress</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">Scheduled</div>
                  <div className="text-2xl font-semibold">{scheduledCount}</div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Completed cost
                  </div>
                  <div className="text-2xl font-semibold">{formatCurrency(completedCost)}</div>
                  <div className="text-xs text-muted-foreground">Recorded in attributes</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => (
              <Card key={col.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        col.tone === 'destructive' && 'bg-destructive',
                        col.tone === 'primary' && 'bg-primary',
                        col.tone === 'warning' && 'bg-warning',
                        col.tone === 'success' && 'bg-success',
                      )}
                    />
                    <CardTitle className="text-sm">{col.title}</CardTitle>
                  </div>
                  <CardDescription>{grouped[col.id].length}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {grouped[col.id].length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Nothing here
                    </div>
                  )}
                  {grouped[col.id].map((w) => {
                    const raw = byRawId[w.rawId];
                    return (
                      <div
                        key={w.id}
                        className="rounded-lg border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-mono text-[10px] text-muted-foreground">{w.id}</div>
                          <div className="flex items-center gap-1">
                            <StatusBadge status={w.priority} />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingRaw(raw || null);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteId(w.rawId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-1 text-sm font-medium">{w.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {w.vehicle} · {w.assignee}
                        </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Start {formatMaintenanceStart(raw?.type, raw?.start)} · Every{' '}
                        {formatMaintenancePeriod(raw?.type, raw?.period)}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Due {w.dueDate}</span>
                        <span className="tabular-nums">
                          {w.cost ? formatCurrency(w.cost) : '—'}
                        </span>
                      </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          {items.length === 0 && !loadError && (
            <EmptyState
              title="No maintenance records"
              description="Create maintenance entries with New work order or in Settings."
            />
          )}
        </>
      )}

      <MaintenanceFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingRaw(null);
        }}
        initial={editingRaw ? { item: editingRaw } : null}
        onSubmit={submitMaintenance}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete maintenance?"
        description="Remove this maintenance rule from the server?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
