import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

export default function GeofencesSettingsPage() {
  const { showError, showSuccess } = useFlash();
  const { data: rows, loading, error, reload } = useListFetch(
    () => api.geofences.list().then((list) => (Array.isArray(list) ? list : [])),
    [],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setArea('POLYGON ((0 0, 0 0.001, 0.001 0.001, 0.001 0, 0 0))');
    setDialogOpen(true);
  };

  const openEdit = (g) => {
    setEditing(g);
    setName(g.name || '');
    setDescription(g.description || '');
    setArea(typeof g.area === 'string' ? g.area : g.area ? JSON.stringify(g.area) : '');
    setDialogOpen(true);
  };

  const save = async () => {
    const n = name.trim();
    const a = area.trim();
    if (!n || !a) {
      showError('Name and area (WKT) are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const current = await api.geofences.get(editing.id);
        await api.geofences.update(editing.id, {
          ...current,
          name: n,
          description: description.trim() || undefined,
          area: a,
        });
        showSuccess('Geofence updated');
      } else {
        await api.geofences.create({
          name: n,
          description: description.trim() || undefined,
          area: a,
        });
        showSuccess('Geofence created');
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
      await api.geofences.remove(deleteId);
      showSuccess('Geofence deleted');
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
        title="Geofences"
        description="WKT area strings — same as Traccar classic (no map editor here)"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/geofences" className="text-sm text-primary underline">
              List view
            </Link>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add geofence
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
                  <TableHead>Area</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{g.id}</TableCell>
                    <TableCell>{g.name}</TableCell>
                    <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                      {g.area ? String(g.area).slice(0, 80) : '—'}
                    </TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit geofence' : 'Add geofence'}</DialogTitle>
            <DialogDescription>
              Enter a well-known text (WKT) polygon or circle. Example: POLYGON ((lon lat, …))
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Name *</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Description</span>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Area (WKT) *</span>
              <Textarea
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="min-h-[120px] font-mono text-xs"
                spellCheck={false}
              />
            </label>
          </div>
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
        title="Delete geofence?"
        description={deleteName ? `Remove “${deleteName}”?` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
