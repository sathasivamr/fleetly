import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export default function AccumulatorsIndexPage() {
  const [q, setQ] = useState('');
  const { data: devices, loading, error } = useListFetch(
    () => api.devices.list().then((list) => (Array.isArray(list) ? list : [])),
    [],
  );

  const filtered = useMemo(() => {
    const list = devices || [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (d) =>
        String(d.name || '')
          .toLowerCase()
          .includes(needle) ||
        String(d.uniqueId || '')
          .toLowerCase()
          .includes(needle) ||
        String(d.id).includes(needle),
    );
  }, [devices, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accumulators"
        description="Per-device engine hours and odometer baseline (PUT /api/devices/:id/accumulators). Pick a device to edit."
      />

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, unique ID, or device ID…"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading devices…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Unique ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">#{d.id}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.uniqueId}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={`/settings/accumulators/${d.id}`}
                        className="text-sm font-medium text-primary underline"
                      >
                        Edit accumulators
                      </Link>
                      <Link
                        to={`/vehicles/${d.id}`}
                        className="ml-3 text-xs text-muted-foreground underline"
                      >
                        Profile
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No devices match your search.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
