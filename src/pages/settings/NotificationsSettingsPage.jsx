import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useListFetch } from '@/hooks/useListFetch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function NotificationsSettingsPage() {
  const navigate = useNavigate();
  const { data: rows, loading, error } = useListFetch(
    () => api.notifications.list().then((list) => (Array.isArray(list) ? list : [])),
    [],
  );

  const list = rows || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Alert rules (GET/POST/PUT/DELETE /api/notifications)"
        actions={
          <Button type="button" size="sm" onClick={() => navigate('/settings/entity/notifications/new')}>
            <Plus className="h-4 w-4" /> Add
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
                  <TableHead>Type</TableHead>
                  <TableHead>Always</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono text-xs">{n.id}</TableCell>
                    <TableCell>{n.type || '—'}</TableCell>
                    <TableCell>{n.always ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Link
                        to={`/settings/entity/notifications/${n.id}`}
                        className="text-sm text-primary underline"
                      >
                        Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
