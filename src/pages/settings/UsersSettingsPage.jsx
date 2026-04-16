import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
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
import { usePermissions } from '@/hooks/usePermissions';
import EmptyState from '@/components/common/EmptyState';
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

export default function UsersSettingsPage() {
  const { manager } = usePermissions();
  const { showError, showSuccess } = useFlash();
  const { data: rows, loading, error, reload } = useListFetch(
    () => api.users.list().then((list) => (Array.isArray(list) ? list : [])),
    [],
    { enabled: Boolean(manager) },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLabel, setDeleteLabel] = useState('');
  const [deleting, setDeleting] = useState(false);

  const list = rows || [];

  const createUser = async () => {
    const n = name.trim();
    const em = email.trim();
    const pw = password;
    if (!n || !em || !pw) {
      showError('Name, email, and password are required');
      return;
    }
    setSaving(true);
    try {
      await api.users.create({
        name: n,
        email: em,
        password: pw,
        administrator: false,
      });
      showSuccess('User created');
      setCreateOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      await reload();
    } catch (e) {
      showError(e.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api.users.remove(deleteId);
      showSuccess('User deleted');
      await reload();
      setDeleteId(null);
    } catch (e) {
      showError(e.message || 'Delete failed');
      throw e;
    } finally {
      setDeleting(false);
    }
  };

  if (!manager) {
    return <EmptyState title="Access denied" description="Managers and administrators can open user management." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="GET/POST/DELETE /api/users — edit JSON per user"
        actions={
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add user
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
                  <TableHead>Email</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.id}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/settings/user/${u.id}`} className="text-sm text-primary underline">
                        Edit
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          setDeleteId(u.id);
                          setDeleteLabel(u.email || u.name);
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>Creates a standard user account on the Traccar server.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createUser} disabled={saving}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete user?"
        description={deleteLabel ? `Remove ${deleteLabel}?` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
