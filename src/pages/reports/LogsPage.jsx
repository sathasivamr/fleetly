import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import EmptyState from '@/components/common/EmptyState';

export default function LogsPage() {
  const { administrator } = usePermissions();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 16);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 16));
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.logs.list({
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  if (!administrator) {
    return <EmptyState title="Admin only" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs"
        actions={
          <Link to="/reports" className="text-sm text-primary underline">
            Back
          </Link>
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button type="button" onClick={run} disabled={loading}>
          Load
        </Button>
      </div>
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            'Loading…'
          ) : (
            <pre className="max-h-[480px] overflow-auto text-xs">{JSON.stringify(rows, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
