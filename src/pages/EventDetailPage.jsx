import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';

export default function EventDetailPage() {
  const { id } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const e = await api.events.get(id);
        if (!cancelled) setEv(e);
      } catch {
        if (!cancelled) setEv(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/alerts">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !ev ? (
        <EmptyState title="Event not found" />
      ) : (
        <>
          <PageHeader title="Event" description={ev.type || 'Event'} />
          <Card>
            <CardContent className="p-4">
              <pre className="max-h-[480px] overflow-auto text-xs">{JSON.stringify(ev, null, 2)}</pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
