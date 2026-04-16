import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import EmptyState from '@/components/common/EmptyState';
import { useFlash } from '@/context/FlashContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ScheduledReportsPage() {
  const { administrator } = usePermissions();
  const navigate = useNavigate();
  const { showError, showSuccess } = useFlash();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.scheduledReports.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!administrator) return;
    reload();
  }, [administrator]);

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api.scheduledReports.remove(deleteId);
      showSuccess('Scheduled report deleted');
      await reload();
      setDeleteId(null);
    } catch (e) {
      showError(e.message || 'Delete failed');
      throw e;
    } finally {
      setDeleting(false);
    }
  };

  if (!administrator) {
    return <EmptyState title="Admin only" description="Scheduled reports require administrator access." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled reports"
        description="Jobs stored on the Traccar server (GET/POST/PUT/DELETE /api/reports)"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/reports" className="text-sm text-primary underline">
              Back
            </Link>
            <Button type="button" size="sm" onClick={() => navigate('/settings/entity/scheduled/new')}>
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
            <div className="p-8 text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No scheduled reports" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>{r.type || '—'}</TableCell>
                    <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                      {JSON.stringify(r)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => navigate(`/settings/entity/scheduled/${r.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(r.id)}
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

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete scheduled report?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
