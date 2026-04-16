import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';

export default function NetworkPage() {
  const { positionId } = useParams();
  const [pos, setPos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.positions.list({ id: positionId });
        const p = Array.isArray(list) ? list[0] : list;
        if (!cancelled) setPos(p || null);
      } catch {
        if (!cancelled) setPos(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [positionId]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/tracking">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !pos ? (
        <EmptyState title="Position not found" />
      ) : (
        <>
          <PageHeader title="Network" description="Position network attributes" />
          <Card>
            <CardContent className="p-4">
              <pre className="max-h-[480px] overflow-auto text-xs">{JSON.stringify(pos, null, 2)}</pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
