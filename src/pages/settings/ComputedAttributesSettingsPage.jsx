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

export default function ComputedAttributesSettingsPage() {
  const navigate = useNavigate();
  const { data: rows, loading, error } = useListFetch(
    () => api.computedAttributes.list().then((list) => (Array.isArray(list) ? list : [])),
    [],
  );

  const list = rows || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Computed attributes"
        description="GET/POST/PUT/DELETE /api/attributes/computed"
        actions={
          <Button type="button" size="sm" onClick={() => navigate('/settings/entity/computed/new')}>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Expression</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>{r.description || '—'}</TableCell>
                    <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                      {r.expression || '—'}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/settings/entity/computed/${r.id}`}
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
