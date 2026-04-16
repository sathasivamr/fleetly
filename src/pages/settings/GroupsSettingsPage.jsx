import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
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

export default function GroupsSettingsPage() {
  const { showError, showSuccess } = useFlash();
  const { data: rows, loading, error, reload } = useListFetch(
    () => api.groups.list().then((list) => (Array.isArray(list) ? list : [])),
    [],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDialogOpen(true);
  };

  const openEdit = (g) => {
    setEditing(g);
    setName(g.name || '');
    setDialogOpen(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showError('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.groups.update(editing.id, { ...editing, name: trimmed });
        showSuccess('Group updated');
      } else {
        await api.groups.create({ name: trimmed });
        showSuccess('Group created');
      }
      setDialogOpen(false);
      await reload();
    } catch (e) {
      showError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api.groups.remove(deleteId);
      showSuccess('Group deleted');
      await reload();
      setDeleteId(null);
    } catch (e) {
      showError(e.message || 'Delete failed');
      throw e;
    } finally {
      setDeleting(false);
    }
  };

  const list = rows || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Device groups (GET/POST/PUT/DELETE /api/groups)"
        actions={
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add group
          </Button>
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
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{g.id}</TableCell>
                    <TableCell>{g.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(g)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          setDeleteId(g.id);
                          setDeleteName(g.name);
                        }}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit group' : 'Add group'}</DialogTitle>
            <DialogDescription>Group name as stored in Traccar.</DialogDescription>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete group?"
        description={deleteName ? `Remove “${deleteName}”? Linked devices may be affected.` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
