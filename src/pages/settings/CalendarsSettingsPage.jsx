import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import CalendarFormDialog from '@/components/calendar/CalendarFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { previewCalendarLabel } from '@/lib/calendarIcs';
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

export default function CalendarsSettingsPage() {
  const { showError, showSuccess } = useFlash();
  const { data: rows, loading, error, reload } = useListFetch(
    () => api.calendars.list().then((list) => (Array.isArray(list) ? list : [])),
    [],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const list = rows || [];

  const submit = async (payload) => {
    try {
      if (editing) {
        await api.calendars.update(editing.id, { ...editing, ...payload });
        showSuccess('Calendar updated');
      } else {
        await api.calendars.create(payload);
        showSuccess('Calendar created');
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
      await api.calendars.remove(deleteId);
      showSuccess('Calendar deleted');
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
        title="Calendars"
        description="Schedules for geofence and notification rules (iCalendar base64, same as Traccar)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add calendar
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
                  <TableHead>Preview</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {previewCalendarLabel(c.data)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditing(c);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link
                        to={`/settings/entity/calendars/${c.id}`}
                        className="ml-1 text-xs text-primary underline"
                      >
                        JSON
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CalendarFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing ? { calendar: editing } : null}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete calendar?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
