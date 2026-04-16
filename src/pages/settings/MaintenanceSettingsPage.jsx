import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import MaintenanceFormDialog from '@/components/maintenance/MaintenanceFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatMaintenancePeriod, formatMaintenanceStart } from '@/lib/maintenanceFormat';
import { useFlash } from '@/context/FlashContext';
import { useListFetch } from '@/hooks/useListFetch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function MaintenanceSettingsPage() {
  const { showError, showSuccess } = useFlash();
  const { data: rows, loading, error, reload } = useListFetch(
    () => api.maintenance.list().then((list) => (Array.isArray(list) ? list : [])),
    [],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const list = rows || [];

  const submitMaintenance = async (payload) => {
    try {
      if (editing) {
        await api.maintenance.update(editing.id, {
          ...editing,
          ...payload,
        });
        showSuccess('Maintenance updated');
      } else {
        await api.maintenance.create(payload);
        showSuccess('Maintenance created');
      }
      setEditing(null);
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
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Service intervals by odometer, hours, or calendar — same rules as classic Traccar."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/maintenance" className="text-sm text-primary underline">
              Board view
            </Link>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.id}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.type || '—'}</TableCell>
                    <TableCell className="text-xs">{formatMaintenanceStart(m.type, m.start)}</TableCell>
                    <TableCell className="text-xs">{formatMaintenancePeriod(m.type, m.period)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditing(m);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MaintenanceFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing ? { item: editing } : null}
        onSubmit={submitMaintenance}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete maintenance?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
